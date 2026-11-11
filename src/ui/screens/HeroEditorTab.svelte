<script lang="ts">
  import { currentHero, searchHero, session } from '../../app/session.svelte';
  import { KNOWN_HERO_NAMES } from '../../data/heroNames';
  import { creatureName, heroClassName } from '../../i18n/game.svelte';
  import { t } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Combobox from '../components/Combobox.svelte';
  import Fieldset from '../components/Fieldset.svelte';
  import SearchForm from '../components/SearchForm.svelte';
  import type { ComboboxItem } from '../components/combobox';
  import { filePercent, formatNumber } from '../format';
  import HeroDialog from './HeroDialog.svelte';

  let dialogOpen = $state(false);

  /** Only the names the open save has heroes for; other names can still be typed in. */
  const nameItems: ComboboxItem<string>[] = $derived(
    KNOWN_HERO_NAMES.filter((name) => session.heroNamesInSave?.has(name)).map((name) => ({
      value: name,
      label: name,
    })),
  );

  /** The list item for the typed name; picking an item sets the text, so nothing to store. */
  const selectedName = $derived(
    session.heroNamesInSave?.has(session.heroName) ? session.heroName : null,
  );

  const hero = $derived(currentHero());
  const percent = $derived(
    session.save && session.heroMatch
      ? filePercent(session.heroMatch.position, session.save.buffer.length)
      : null,
  );
</script>

{#if !session.save}
  <p class="muted">{t('hero.noSave')}</p>
{:else}
  <div class="layout">
    <SearchForm
      legend={t('hero.searchTitle')}
      findLabel={t('hero.find')}
      {percent}
      positionText={t('hero.position', { percent: percent ?? 0 })}
      onfind={searchHero}
    >
      <!-- Picking a name from the list searches at once; Enter on typed text submits the form. -->
      <Combobox
        label={t('hero.name')}
        items={nameItems}
        value={selectedName}
        bind:text={session.heroName}
        allowCustom
        onpick={searchHero}
        placeholder={t('hero.namePlaceholder')}
        hint={t('hero.nameHint')}
      />
    </SearchForm>

    {#if hero}
      <Fieldset legend={t('hero.summaryTitle')}>
        <div class="summary">
          <dl>
            <dt>{t('hero.class')}</dt>
            <dd>{heroClassName(hero.classId)}</dd>
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
            <ol class="troops">
              {#each hero.troops as troop, slot (slot)}
                <li>
                  {#if troop}
                    <span>{creatureName(troop.creatureId)}</span>
                    <span class="count">{formatNumber(troop.count)}</span>
                  {:else}
                    <span class="muted">{t('hero.emptySlot')}</span>
                  {/if}
                </li>
              {/each}
            </ol>
          </div>
        </div>
        <div class="actions">
          <Button
            variant="primary"
            icon="hero"
            hint={t('hero.parametersHint')}
            onclick={() => (dialogOpen = true)}
          >
            {t('hero.parameters')}
          </Button>
        </div>
      </Fieldset>
    {/if}
  </div>

  {#if hero && dialogOpen}
    <HeroDialog bind:open={dialogOpen} original={hero} />
  {/if}
{/if}

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) minmax(0, 2fr);
    gap: var(--space-4);
    align-items: start;
  }

  @media (max-width: 760px) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: var(--space-4);
  }

  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-1) var(--space-4);
    margin: var(--space-2) 0 0;
  }

  dt {
    color: var(--color-label);
    font-size: 13px;
  }

  dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }

  h3 {
    font-size: 14px;
    margin: var(--space-2) 0 var(--space-2);
  }

  .troops {
    margin: 0;
    padding-left: var(--space-5);
    display: grid;
    gap: var(--space-1);
  }

  .troops li {
    padding-left: var(--space-1);
  }

  .troops li span:first-child {
    margin-right: var(--space-2);
  }

  .count {
    color: var(--color-label);
    font-variant-numeric: tabular-nums;
  }

  .muted {
    color: var(--color-text-muted);
  }
</style>
