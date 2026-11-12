<script lang="ts">
  import { session } from '../../../app/session.svelte';
  import type { Hero } from '../../../core/hero';
  import { COMMON_HERO_FIELDS } from '../../../core/layouts';
  import { artifactAllowed } from '../../../core/rules';
  import { ARTIFACTS, ARTIFACT_CATEGORIES, type ArtifactCategory } from '../../../data/artifacts';
  import { isAvailableIn } from '../../../data/editions';
  import { artifactDescription, artifactName } from '../../../i18n/game.svelte';
  import { t } from '../../../i18n/index.svelte';
  import { tooltip } from '../../actions/tooltip';
  import Combobox from '../../components/Combobox.svelte';
  import FilterRow from '../../components/FilterRow.svelte';
  import Icon from '../../components/Icon.svelte';
  import type { ComboboxItem } from '../../components/combobox';
  import ArtifactCategoryIcon from './ArtifactCategoryIcon.svelte';

  interface Props {
    hero: Hero;
  }

  let { hero = $bindable() }: Props = $props();

  let toAdd: number | null = $state(null);
  let search = $state('');
  let filter: ArtifactCategory | null = $state(null);
  const max = COMMON_HERO_FIELDS.backpackSlots;
  const full = $derived(hero.backpack.length >= max);

  const carried = $derived(new Set(hero.backpack));

  const items: ComboboxItem<number>[] = $derived(
    // Unused artifacts and those the save's edition does not know are left out altogether.
    ARTIFACTS.filter(
      (artifact) =>
        !artifact.unused &&
        isAvailableIn(artifact.introducedIn, session.edition) &&
        (filter === null || artifact.category === filter),
    ).map((artifact) => ({
      value: artifact.id,
      label: artifactName(artifact.id),
      description: artifactDescription(artifact.id),
      highlighted: carried.has(artifact.id),
    })),
  );

  function put(id: number): void {
    if (!full && artifactAllowed(id, session.edition)) {
      hero.backpack.push(id);
    }
  }

  /** Clicking or Enter on an option puts it in at once; the field stays empty for the next one. */
  function onPick(item: ComboboxItem<number>): void {
    put(item.value);
    toAdd = null;
    search = '';
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

<FilterRow
  label={t('heroDialog.artifactFilter')}
  options={ARTIFACT_CATEGORIES}
  bind:value={filter}
  columns={7}
  even={false}
  hint={(category) => t(`artifactCategoryHint.${category}`)}
>
  {#snippet chip(category)}
    <ArtifactCategoryIcon {category} size={20} />
    {t(`artifactCategory.${category}`)}
  {/snippet}
</FilterRow>

<div class="add">
  <Combobox
    label={t('heroDialog.artifactToAdd')}
    {items}
    bind:value={toAdd}
    bind:text={search}
    onpick={onPick}
    optionAction={{
      icon: 'plus',
      label: t('heroDialog.addArtifact'),
      disabled: full,
      run: (item) => put(item.value),
    }}
  >
    {#snippet optionIcon(item)}
      {@const category = ARTIFACTS[item.value]?.category}
      {#if category}
        <ArtifactCategoryIcon {category} />
      {/if}
    {/snippet}
  </Combobox>
</div>

<h3>{t('heroDialog.backpack', { count: hero.backpack.length, max })}</h3>
{#if hero.backpack.length === 0}
  <p class="muted">{t('heroDialog.emptyBackpack')}</p>
{:else}
  <ul>
    {#each hero.backpack as artifactId, index (index)}
      {@const category = ARTIFACTS[artifactId]?.category}
      <li>
        {#if category}
          <span class="icon"><ArtifactCategoryIcon {category} /></span>
        {/if}
        <span class="name">{artifactName(artifactId)}</span>
        <span class="effect">{artifactDescription(artifactId)}</span>
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
    margin-top: var(--space-3);
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
    grid-template-columns: 22px minmax(0, 1fr) auto;
    grid-template-rows: auto auto;
    column-gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--color-frame-soft);
  }

  li:last-child {
    border-bottom: 0;
  }

  .icon {
    grid-column: 1;
    grid-row: 1 / span 2;
    align-self: center;
    display: flex;
  }

  .name {
    grid-column: 2;
  }

  .effect {
    grid-column: 2;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .remove {
    grid-column: 3;
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
