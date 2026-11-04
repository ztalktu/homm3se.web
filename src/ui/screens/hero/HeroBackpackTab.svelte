<script lang="ts">
  import { session } from '../../../app/session.svelte';
  import { showToast } from '../../../app/toasts.svelte';
  import type { Hero } from '../../../core/hero';
  import { HERO_LAYOUT } from '../../../core/layout';
  import { BLOCKED_ARTIFACT_IDS, artifactAllowed } from '../../../core/rules';
  import { ARTIFACTS } from '../../../data/artifacts';
  import { isAvailableIn } from '../../../data/editions';
  import { artifactEffect, artifactName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import { tooltip } from '../../actions/tooltip';
  import Button from '../../components/Button.svelte';
  import Combobox from '../../components/Combobox.svelte';
  import Icon from '../../components/Icon.svelte';
  import type { ComboboxItem } from '../../components/combobox';

  interface Props {
    hero: Hero;
  }

  let { hero = $bindable() }: Props = $props();

  let toAdd: number | null = $state(null);
  const max = HERO_LAYOUT.backpackSlots;
  const full = $derived(hero.backpack.length >= max);

  function describe(id: number): string | undefined {
    return ARTIFACTS[id]?.notRecommended ? t('joke.notRecommended') : artifactEffect(id);
  }

  const items: ComboboxItem<number>[] = $derived(
    ARTIFACTS.map((artifact) => ({
      value: artifact.id,
      label: artifactName(artifact.id),
      description: describe(artifact.id),
      // The spell scroll stays visible: picking it gets the old telling-off instead.
      disabled:
        !BLOCKED_ARTIFACT_IDS.includes(artifact.id) &&
        !isAvailableIn(artifact.introducedIn, session.edition),
    })),
  );

  function onPick(id: number | null): void {
    if (id !== null && BLOCKED_ARTIFACT_IDS.includes(id)) {
      showToast(t('joke.spellScroll'), { kind: 'warning' });
      toAdd = null;
    }
  }

  function add(): void {
    if (toAdd !== null && !full && artifactAllowed(toAdd, session.edition)) {
      hero.backpack.push(toAdd);
    }
  }

  function remove(index: number): void {
    hero.backpack.splice(index, 1);
  }

  function onItemKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Delete') {
      event.preventDefault();
      remove(index);
    }
  }
</script>

<div class="add">
  <Combobox label={t('heroDialog.artifactToAdd')} {items} bind:value={toAdd} onchange={onPick} />
  <Button icon="plus" disabled={toAdd === null || full} onclick={add}>
    {t('heroDialog.addArtifact')}
  </Button>
</div>

<h3>{t('heroDialog.backpack', { count: hero.backpack.length, max })}</h3>
{#if hero.backpack.length === 0}
  <p class="muted">{t('heroDialog.emptyBackpack')}</p>
{:else}
  <ul>
    {#each hero.backpack as artifactId, index (index)}
      <li>
        <span class="name">{artifactName(artifactId)}</span>
        <span class="effect">{describe(artifactId)}</span>
        <button
          type="button"
          class="remove"
          aria-label={`${t('heroDialog.removeArtifact')}: ${artifactName(artifactId)}`}
          onclick={() => remove(index)}
          onkeydown={(event) => onItemKeydown(event, index)}
          use:tooltip={t('heroDialog.removeArtifactHint')}
        >
          <Icon name="trash" size={16} />
        </button>
      </li>
    {/each}
  </ul>
{/if}

<style>
  .add {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--space-2);
    align-items: end;
  }

  h3 {
    margin: var(--space-4) 0 var(--space-2);
    font-size: 14px;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    border: 1px solid var(--color-frame-soft);
    border-radius: var(--radius-small);
    max-height: 320px;
    overflow-y: auto;
  }

  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
    column-gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-frame-soft);
  }

  li:last-child {
    border-bottom: 0;
  }

  .name {
    grid-column: 1;
  }

  .effect {
    grid-column: 1;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .remove {
    grid-column: 2;
    grid-row: 1 / span 2;
    align-self: center;
    display: flex;
    padding: var(--space-1);
    border: 1px solid transparent;
    border-radius: var(--radius-small);
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
  }

  .remove:hover {
    border-color: var(--color-danger);
    color: var(--color-error-text);
  }

  .muted {
    margin: 0;
    color: var(--color-text-muted);
  }
</style>
