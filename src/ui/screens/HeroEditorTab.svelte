<script lang="ts">
  import {
    currentHero,
    currentHeroOwner,
    filterHeroesByOwner,
    filterHeroesByTown,
    heroNamesInList,
    heroOwnersInSave,
    heroTownsInSave,
    searchHero,
    session,
  } from '../../app/session.svelte';
  import { classTown } from '../../data/heroClasses';
  import { PLAYER_COLORS } from '../../data/players';
  import type { HeroOwner } from '../../core/hero';
  import { heroClassName, playerLabel, townName } from '../../i18n/game.svelte';
  import { t } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import ChoicePicker from '../components/ChoicePicker.svelte';
  import Combobox from '../components/Combobox.svelte';
  import PlayerFlag from '../components/PlayerFlag.svelte';
  import SearchForm from '../components/SearchForm.svelte';
  import type { ComboboxItem } from '../components/combobox';
  import { filePercent, formatNumber } from '../format';
  import HeroDialog from './HeroDialog.svelte';
  import TownIcon from './hero/TownIcon.svelte';
  import EditorLayout from './shared/EditorLayout.svelte';
  import PickerRows from './shared/PickerRows.svelte';
  import SummaryPanel from './shared/SummaryPanel.svelte';
  import TroopList from './shared/TroopList.svelte';

  let dialogOpen = $state(false);

  /** Owners present in the open save, in player order, free heroes last. */
  const ownersInSave: HeroOwner[] = $derived.by(() => {
    const present = heroOwnersInSave();
    return [...PLAYER_COLORS, null].filter((owner) => present.includes(owner));
  });

  const townsInSave = $derived(heroTownsInSave());

  /**
   * Only the names the open save has heroes for, narrowed by the filters; other names can still
   * be typed in. Owned heroes get their player colors on the right.
   */
  const nameItems: ComboboxItem<string>[] = $derived(
    heroNamesInList().map((name) => {
      const owners = session.heroNamesInSave?.get(name)?.owners ?? [];
      const marks = owners.flatMap((owner) => (owner ? [`var(--color-player-${owner})`] : []));
      return { value: name, label: name, marks };
    }),
  );

  /** The list item for the typed name; picking an item sets the text, so nothing to store. */
  const selectedName = $derived(
    session.heroNamesInSave?.has(session.heroName) ? session.heroName : null,
  );

  const hero = $derived(currentHero());
  const owner = $derived(currentHeroOwner());
  const heroTown = $derived(hero ? classTown(hero.classId) : undefined);
  const percent = $derived(
    session.save && session.heroMatch
      ? filePercent(session.heroMatch.position, session.save.buffer.length)
      : null,
  );
</script>

<EditorLayout>
  <SearchForm
    legend={t('hero.searchTitle')}
    findLabel={t('hero.find')}
    {percent}
    positionText={t('hero.position', { percent: percent ?? 0 })}
    onfind={searchHero}
  >
    {#if ownersInSave.length > 1 || townsInSave.length > 1}
      <PickerRows>
        {#if ownersInSave.length > 1}
          <ChoicePicker
            label={t('hero.playerFilter')}
            options={ownersInSave}
            selected={session.ownerFilter}
            optionLabel={playerLabel}
            onpick={filterHeroesByOwner}
            round
            inlineLabel
          >
            {#snippet icon(color)}<PlayerFlag {color} size={14} />{/snippet}
          </ChoicePicker>
        {/if}
        {#if townsInSave.length > 1}
          <ChoicePicker
            label={t('hero.townFilter')}
            options={townsInSave}
            selected={session.townFilter}
            optionLabel={townName}
            onpick={filterHeroesByTown}
            inlineLabel
          >
            {#snippet icon(town)}<TownIcon group={town} size={18} />{/snippet}
          </ChoicePicker>
        {/if}
      </PickerRows>
    {/if}
    <!-- Picking a name from the list searches at once; Enter on typed text submits the form. -->
    <Combobox
      label={t('hero.name')}
      items={nameItems}
      value={selectedName}
      bind:text={session.heroName}
      allowCustom
      onpick={searchHero}
      hint={t('hero.nameHint')}
      hintDelayMs={2000}
    >
      {#snippet optionIcon(item)}
        <TownIcon group={session.heroNamesInSave?.get(item.value)?.town} size={18} />
      {/snippet}
    </Combobox>
  </SearchForm>

  {#if hero}
    <SummaryPanel legend={t('hero.summaryTitle')}>
      <dl>
        <dt>{t('hero.player')}</dt>
        <dd class="with-icon" class:muted={!owner}>
          <PlayerFlag color={owner} />
          {playerLabel(owner)}
        </dd>
        <dt>{t('hero.class')}</dt>
        <dd class="with-icon">
          {#if heroTown}<TownIcon group={heroTown} size={18} />{/if}
          {heroClassName(hero.classId)}
          {#if heroTown}<span class="muted">· {townName(heroTown)}</span>{/if}
        </dd>
        <dt>{t('hero.level')}</dt>
        <dd>{hero.level}</dd>
        <dt>{t('hero.experience')}</dt>
        <dd>{formatNumber(hero.experience)}</dd>
        <dt>{t('hero.attack')}</dt>
        <dd>{hero.attack}</dd>
        <dt>{t('hero.defense')}</dt>
        <dd>{hero.defense}</dd>
        <dt>{t('hero.spellPower')}</dt>
        <dd>{hero.spellPower}</dd>
        <dt>{t('hero.knowledge')}</dt>
        <dd>{hero.knowledge}</dd>
      </dl>
      <div>
        <h3>{t('hero.troops')}</h3>
        <TroopList troops={hero.troops} />
      </div>
      {#snippet actions()}
        <Button
          variant="primary"
          icon="hero"
          hint={t('hero.parametersHint')}
          onclick={() => (dialogOpen = true)}
        >
          {t('hero.parameters')}
        </Button>
      {/snippet}
    </SummaryPanel>
  {/if}
</EditorLayout>

{#if hero && dialogOpen}
  <HeroDialog bind:open={dialogOpen} original={hero} />
{/if}
