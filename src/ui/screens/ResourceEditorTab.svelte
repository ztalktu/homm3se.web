<script lang="ts">
  import {
    applyResources,
    currentResources,
    playersWithTreasury,
    searchResources,
    shownTreasuryColor,
    selectTreasuryByColor,
    session,
  } from '../../app/session.svelte';
  import { tick } from 'svelte';
  import { playerLabel } from '../../i18n/game.svelte';
  import {
    MAX_RESOURCE_AMOUNT,
    OTHER_RESOURCES,
    type OtherResource,
    type Resource,
  } from '../../core/layouts';
  import type { ResourceAmounts } from '../../core/resources';
  import { t, type MessageKey } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Checkbox from '../components/Checkbox.svelte';
  import Fieldset from '../components/Fieldset.svelte';
  import NumberField from '../components/NumberField.svelte';
  import PlayerFlag from '../components/PlayerFlag.svelte';
  import PlayerPicker from '../components/PlayerPicker.svelte';
  import ResourceIcon from '../components/ResourceIcon.svelte';
  import SearchForm from '../components/SearchForm.svelte';
  import { filePercent, formatNumber } from '../format';

  /** Gold first: it is the resource players look for, as in the search above. */
  const TABLE_RESOURCES: Resource[] = ['gold', ...OTHER_RESOURCES];

  const resourceLabel = (resource: Resource): string => t(`resource.${resource}` as MessageKey);
  const alsoHint = (resource: OtherResource): string =>
    t('resources.alsoHint', { resource: resourceLabel(resource).toLocaleLowerCase() });

  /** A click on the amount of a filter that is off turns the filter on and puts the cursor in. */
  async function switchFilterOn(resource: OtherResource, cover: HTMLElement): Promise<void> {
    const field = cover.parentElement?.querySelector('input');
    session.resourceFilters[resource].enabled = true;
    await tick();
    field?.focus();
    field?.select();
  }

  const found = $derived(currentResources());
  const players = $derived(playersWithTreasury());
  /** The color buttons work only when the save's game has a known player block. */
  const byAmountOnly = $derived(session.playerTreasuries === null);
  const byAmount = $derived(session.resourceSearchByAmount);
  const ownerColor = $derived(shownTreasuryColor() ?? undefined);
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
      {percent}
      positionText={t('resources.position', { percent: percent ?? 0 })}
      onfind={searchResources}
      disabled={!byAmount}
    >
      {#if !byAmountOnly}
        <PlayerPicker
          label={t('hero.playerFilter')}
          owners={players}
          selected={ownerColor}
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
      <!-- Gold sits in the same two columns as the filters below: name on the left, amount on
           the right. The field keeps its own hidden label for screen readers. -->
      <div class="filters">
        <span class="gold" class:disabled={!byAmount} aria-hidden="true">
          <ResourceIcon resource="gold" />{t('resources.gold')}
        </span>
        <NumberField
          label={t('resources.gold')}
          hideLabel
          hint={t('resources.goldHint')}
          bind:value={session.goldQuery}
          max={MAX_RESOURCE_AMOUNT}
          bigStep={1000}
          disabled={!byAmount}
        />
      </div>
      <p class="also" class:disabled={!byAmount}>{t('resources.also')}</p>
      <div class="filters">
        {#each OTHER_RESOURCES as resource (resource)}
          <Checkbox
            label={resourceLabel(resource)}
            hint={alsoHint(resource)}
            bind:checked={session.resourceFilters[resource].enabled}
            disabled={!byAmount}
          >
            {#snippet icon()}<ResourceIcon {resource} />{/snippet}
          </Checkbox>
          <div class="amount">
            <NumberField
              label={t('resources.filterAmount', { resource: resourceLabel(resource) })}
              hideLabel
              bind:value={session.resourceFilters[resource].amount}
              max={MAX_RESOURCE_AMOUNT}
              disabled={!byAmount || !session.resourceFilters[resource].enabled}
            />
            {#if byAmount && !session.resourceFilters[resource].enabled}
              <!-- A disabled input gets no clicks, so this cover takes them. Keyboards have the
                   checkbox for the same thing. -->
              <button
                type="button"
                class="switch-on"
                tabindex="-1"
                aria-label={alsoHint(resource)}
                onclick={(event) => switchFilterOn(resource, event.currentTarget)}
              ></button>
            {/if}
          </div>
        {/each}
      </div>
    </SearchForm>

    {#if found && draft}
      <Fieldset legend={t('resources.foundTitle')}>
        <div class="table">
          <!-- Whose treasury this is, over the resource names, when it is a player's one. -->
          <span class="head player">
            {#if ownerColor}<PlayerFlag color={ownerColor} />{playerLabel(ownerColor)}{/if}
          </span>
          <span class="head">{t('resources.found')}</span>
          <span class="head">{t('resources.new')}</span>
          {#each TABLE_RESOURCES as resource (resource)}
            <span class="name"><ResourceIcon {resource} />{resourceLabel(resource)}</span>
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

  .also.disabled,
  .gold.disabled {
    opacity: 0.55;
  }

  /* An icon before the text: gold above the filters, resource names and the player's flag. */
  .gold,
  .name,
  .player {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  /* Indented past the checkbox, so the gold icon lines up with the filter icons. */
  .gold {
    padding-left: calc(18px + var(--space-2));
  }

  .filters {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(110px, 1fr);
    gap: var(--space-2) var(--space-3);
    align-items: center;
  }

  .amount {
    position: relative;
    min-width: 0;
  }

  .switch-on {
    position: absolute;
    inset: 0;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: text;
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
