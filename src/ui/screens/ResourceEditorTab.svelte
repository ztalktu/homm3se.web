<script lang="ts">
  import {
    applyResources,
    currentResources,
    playersWithTreasury,
    searchResources,
    selectedTreasuryColor,
    selectTreasuryByColor,
    session,
  } from '../../app/session.svelte';
  import { playerLabel } from '../../i18n/game.svelte';
  import { MAX_RESOURCE_AMOUNT, OTHER_RESOURCES, type Resource } from '../../core/layouts';
  import type { ResourceAmounts } from '../../core/resources';
  import { t, type MessageKey } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Checkbox from '../components/Checkbox.svelte';
  import Fieldset from '../components/Fieldset.svelte';
  import NumberField from '../components/NumberField.svelte';
  import PlayerPicker from '../components/PlayerPicker.svelte';
  import SearchForm from '../components/SearchForm.svelte';
  import { filePercent, formatNumber } from '../format';

  /** Gold first: it is the resource players look for, as in the search above. */
  const TABLE_RESOURCES: Resource[] = ['gold', ...OTHER_RESOURCES];

  const resourceLabel = (resource: Resource): string => t(`resource.${resource}` as MessageKey);

  const found = $derived(currentResources());
  const players = $derived(playersWithTreasury());
  /** The color buttons work only when the save's game has a known player block. */
  const byAmountOnly = $derived(session.playerTreasuries === null);
  const byAmount = $derived(session.resourceSearchByAmount);
  const selectedColor = $derived(selectedTreasuryColor() ?? undefined);
  // Not a writable $derived: that would not be deeply reactive, and the fields bind into it.
  // eslint-disable-next-line svelte/prefer-writable-derived
  let draft: ResourceAmounts | null = $state(null);

  // Every new hit (or a write) starts the "new values" column from what is in the save.
  $effect(() => {
    draft = found ? { ...found } : null;
  });

  const percent = $derived(
    session.save && session.goldPosition !== null
      ? filePercent(session.goldPosition, session.save.buffer.length)
      : null,
  );
</script>

{#if !session.save}
  <p class="muted">{t('resources.noSave')}</p>
{:else}
  <div class="layout">
    <SearchForm
      legend={t('resources.searchTitle')}
      findLabel={t('resources.find')}
      findNextLabel={t('resources.findNext')}
      {percent}
      positionText={t('resources.position', { percent: percent ?? 0 })}
      onfind={searchResources}
      disabled={!byAmount}
    >
      {#if !byAmountOnly}
        <PlayerPicker
          label={t('hero.playerFilter')}
          owners={players}
          selected={selectedColor}
          ownerLabel={playerLabel}
          onpick={selectTreasuryByColor}
          disabled={byAmount}
        />
      {/if}
      <Checkbox
        label={t('resources.byAmount')}
        hint={byAmountOnly ? t('resources.byAmountOnlyHint') : t('resources.byAmountHint')}
        bind:checked={session.resourceSearchByAmount}
        disabled={byAmountOnly}
      />
      <NumberField
        label={t('resources.gold')}
        hint={t('resources.goldHint')}
        bind:value={session.goldQuery}
        max={MAX_RESOURCE_AMOUNT}
        bigStep={1000}
        disabled={!byAmount}
      />
      <p class="also" class:disabled={!byAmount}>{t('resources.also')}</p>
      <div class="filters">
        {#each OTHER_RESOURCES as resource (resource)}
          <Checkbox
            label={resourceLabel(resource)}
            hint={t('resources.alsoHint', {
              resource: resourceLabel(resource).toLocaleLowerCase(),
            })}
            bind:checked={session.resourceFilters[resource].enabled}
            disabled={!byAmount}
          />
          <NumberField
            label={t('resources.filterAmount', { resource: resourceLabel(resource) })}
            hideLabel
            bind:value={session.resourceFilters[resource].amount}
            max={MAX_RESOURCE_AMOUNT}
            disabled={!byAmount || !session.resourceFilters[resource].enabled}
          />
        {/each}
      </div>
    </SearchForm>

    {#if found && draft}
      <Fieldset legend={t('resources.foundTitle')}>
        <div class="table">
          <span></span>
          <span class="head">{t('resources.found')}</span>
          <span class="head">{t('resources.new')}</span>
          {#each TABLE_RESOURCES as resource (resource)}
            <span class="name">{resourceLabel(resource)}</span>
            <span class="value">{formatNumber(found[resource])}</span>
            <NumberField
              label={t('resources.newAmount', { resource: resourceLabel(resource) })}
              hideLabel
              bind:value={draft[resource]}
              max={MAX_RESOURCE_AMOUNT}
              bigStep={resource === 'gold' ? 1000 : 10}
            />
          {/each}
        </div>
        <div class="actions">
          <Button
            variant="primary"
            icon="chest"
            hint={t('resources.applyHint')}
            onclick={() => draft && applyResources($state.snapshot(draft))}
          >
            {t('resources.apply')}
          </Button>
        </div>
      </Fieldset>
    {/if}
  </div>
{/if}

<style>
  .layout {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) minmax(0, 1.3fr);
    gap: var(--space-4);
    align-items: start;
  }

  @media (max-width: 760px) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .also {
    margin: 0;
    font-size: 13px;
    color: var(--color-label);
  }

  .also.disabled {
    opacity: 0.55;
  }

  .filters {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(110px, 1fr);
    gap: var(--space-2) var(--space-3);
    align-items: center;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-2);
    margin-top: var(--space-4);
  }

  .table {
    display: grid;
    grid-template-columns: max-content minmax(90px, 1fr) minmax(120px, 1.2fr);
    gap: var(--space-2) var(--space-4);
    align-items: center;
  }

  .head {
    font-size: 13px;
    color: var(--color-label);
  }

  .value {
    font-variant-numeric: tabular-nums;
  }

  .muted {
    color: var(--color-text-muted);
  }
</style>
