<script lang="ts">
  import { currentHero, searchHero, session } from '../../app/session.svelte';
  import { HERO_NAMES } from '../../data/heroNames';
  import { creatureName, heroClassName } from '../../i18n/game.svelte';
  import { t } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Combobox from '../components/Combobox.svelte';
  import Fieldset from '../components/Fieldset.svelte';
  import SearchForm from '../components/SearchForm.svelte';
  import type { ComboboxItem } from '../components/combobox';
  import { filePercent, formatNumber } from '../format';
  import HeroDialog from './HeroDialog.svelte';

  let selectedName: string | null = $state(null);
  let dialogOpen = $state(false);

  /** Names from both game languages: the save may come from either installation. */
  const nameItems: ComboboxItem<string>[] = [
    ...new Set([...HERO_NAMES.english, ...HERO_NAMES.russian]),
  ].map((name) => ({ value: name, label: name }));

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
      findNextLabel={t('hero.findNext')}
      {percent}
      positionText={t('hero.position', { percent: percent ?? 0 })}
      onfind={searchHero}
    >
      <!-- Enter in the name field searches when no list option is highlighted. -->
      <Combobox
        label={t('hero.name')}
        items={nameItems}
        bind:value={selectedName}
        bind:text={session.heroName}
        allowCustom
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
