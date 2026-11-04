<script lang="ts">
  import {
    applyResources,
    currentResources,
    searchResources,
    session,
  } from '../../app/session.svelte';
  import { MAX_RESOURCE_AMOUNT, RESOURCES, type Resource } from '../../core/layout';
  import type { ResourceAmounts } from '../../core/resources';
  import { t, type MessageKey } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Checkbox from '../components/Checkbox.svelte';
  import Fieldset from '../components/Fieldset.svelte';
  import NumberField from '../components/NumberField.svelte';
  import SearchForm from '../components/SearchForm.svelte';
  import { filePercent, formatNumber } from '../format';

  type OtherResource = Exclude<Resource, 'gold'>;
  const OTHER_RESOURCES = RESOURCES.filter(
    (resource): resource is OtherResource => resource !== 'gold',
  );

  const resourceLabel = (resource: Resource): string => t(`resource.${resource}` as MessageKey);

  const found = $derived(currentResources());
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
    >
      <NumberField
        label={t('resources.gold')}
        hint={t('resources.goldHint')}
        bind:value={session.goldQuery}
        max={MAX_RESOURCE_AMOUNT}
        bigStep={1000}
      />
      <p class="also">{t('resources.also')}</p>
      <div class="filters">
        {#each OTHER_RESOURCES as resource (resource)}
          <Checkbox
            label={resourceLabel(resource)}
            hint={t('resources.alsoHint', {
              resource: resourceLabel(resource).toLocaleLowerCase(),
            })}
            bind:checked={session.resourceFilters[resource].enabled}
          />
          <NumberField
            label={t('resources.filterAmount', { resource: resourceLabel(resource) })}
            hideLabel
            bind:value={session.resourceFilters[resource].amount}
            max={MAX_RESOURCE_AMOUNT}
            disabled={!session.resourceFilters[resource].enabled}
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
          {#each RESOURCES as resource (resource)}
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
