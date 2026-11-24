<script lang="ts">
  /**
   * The town editor: buildings, garrison and mage guild on a draft; nothing reaches the save until
   * "Apply". A town of a layout not fully studied asks once more before it is written.
   */
  import {
    applyTown,
    capitolElsewhere,
    townFaction,
    townsFullyStudied,
  } from '../../app/towns.svelte';
  import { BUILDING, type FactionBuildings } from '../../data/buildings';
  import type { Town } from '../../core/town';
  import {
    buildingMasks,
    fillGuild,
    guildCapacities,
    guildChoice,
    guildSpellsToWrite,
    sameBuildings,
    townBuildings,
    type BuildingChange,
  } from '../../core/townBuildings';
  import { t } from '../../i18n/index.svelte';
  import Button from '../components/Button.svelte';
  import Dialog from '../components/Dialog.svelte';
  import EditorDialog from '../components/EditorDialog.svelte';
  import TownPresetDialog, { type TownPresetLoad } from './presets/TownPresetDialog.svelte';
  import PresetButtons from './presets/PresetButtons.svelte';
  import TroopsEditor from './shared/TroopsEditor.svelte';
  import WarningNote from './shared/WarningNote.svelte';
  import TownBuildingsTab from './town/TownBuildingsTab.svelte';
  import TownGuildTab from './town/TownGuildTab.svelte';

  interface Props {
    open: boolean;
    /** The town as read from the save; the dialog edits a copy. */
    original: Town;
    buildings: FactionBuildings;
  }

  let { open = $bindable(), original, buildings }: Props = $props();

  type TabId = 'buildings' | 'garrison' | 'guild';

  // svelte-ignore state_referenced_locally
  const opened = townBuildings(original, buildings);
  // svelte-ignore state_referenced_locally
  const openedGuild = guildChoice(original);
  // svelte-ignore state_referenced_locally
  const faction = townFaction(original) ?? 'castle';
  // svelte-ignore state_referenced_locally
  const capitolTown = capitolElsewhere(original)?.name;

  let have: number[] = $state([...opened].sort((a, b) => a - b));
  // svelte-ignore state_referenced_locally
  let garrison = $state(structuredClone($state.snapshot(original.garrison)));
  let chosen: number[][] = $state(openedGuild.map((row) => [...row]));
  let activeTab: TabId = $state('buildings');
  let problems: string[] = $state([]);
  let confirmOpen = $state(false);
  let presetWindow: 'save' | 'load' | null = $state(null);
  /** The Capitol cannot go up while another town of the player has one. */
  const locked: ReadonlySet<number> = new Set(capitolTown ? [BUILDING.capitol] : []);

  const haveSet = $derived(new Set(have));

  /** Unchanged buildings keep the guild's slots as the file has them. */
  function capacitiesFor(buildingSet: ReadonlySet<number>): number[] {
    return sameBuildings(buildingSet, opened)
      ? original.guildSlots
      : guildCapacities(buildingSet, original.faction);
  }

  const capacities = $derived(capacitiesFor(haveSet));

  // svelte-ignore state_referenced_locally
  const startedAs = JSON.stringify({ have, garrison: $state.snapshot(garrison), chosen });
  const changed = $derived(
    JSON.stringify({
      have,
      garrison: $state.snapshot(garrison),
      chosen: $state.snapshot(chosen),
    }) !== startedAs,
  );

  const tabs = $derived([
    { id: 'buildings' as const, label: t('townDialog.tab.buildings') },
    { id: 'garrison' as const, label: t('townDialog.tab.garrison') },
    { id: 'guild' as const, label: t('townDialog.tab.guild') },
  ]);

  /** New buildings (from the Buildings tab or a preset); guild levels follow their buildings. */
  function changeBuildings(buildingSet: ReadonlySet<number>): void {
    have = [...buildingSet].sort((a, b) => a - b);
    chosen = sameBuildings(buildingSet, opened)
      ? openedGuild.map((row) => [...row])
      : fillGuild(chosen, guildCapacities(buildingSet, original.faction), original.faction);
  }

  function loadPreset(load: TownPresetLoad): void {
    if (load.buildings) {
      changeBuildings(load.buildings);
    }
    if (load.garrison) {
      garrison = load.garrison;
    }
    if (load.guild) {
      chosen = fillGuild(load.guild, capacitiesFor(new Set(have)), original.faction);
    }
  }

  function findProblems(): string[] {
    return capacities.flatMap((capacity, level) => {
      const missing = capacity - (chosen[level]?.length ?? 0);
      return missing > 0
        ? [t('problem.guildLevelNotFull', { level: level + 1, count: missing })]
        : [];
    });
  }

  function apply(): void {
    problems = findProblems();
    if (problems.length > 0) {
      return;
    }
    if (!townsFullyStudied() && !confirmOpen) {
      confirmOpen = true;
      return;
    }
    confirmOpen = false;
    const masks = buildingMasks(original, haveSet, buildings);
    applyTown({
      ...original,
      garrison: $state.snapshot(garrison),
      built: masks.built,
      builtAll: masks.builtAll,
      guildSlots: [...capacities],
      guildSpells: guildSpellsToWrite(original, $state.snapshot(chosen)),
    });
    open = false;
  }
</script>

<EditorDialog
  bind:open
  title={t('townDialog.title', { name: original.name })}
  {tabs}
  bind:active={activeTab}
  tabsLabel={t('townDialog.tabs')}
  {changed}
  {problems}
  unsavedText={t('townDialog.unsavedText')}
  onapply={apply}
  size="wide"
>
  {#snippet actions()}
    <PresetButtons
      kind="town"
      onsave={() => (presetWindow = 'save')}
      onload={() => (presetWindow = 'load')}
    />
  {/snippet}
  {#if activeTab === 'buildings'}
    <TownBuildingsTab
      have={haveSet}
      {opened}
      town={original}
      {faction}
      {buildings}
      {capitolTown}
      {locked}
      onchange={(change: BuildingChange) => changeBuildings(change.buildings)}
    />
  {:else if activeTab === 'garrison'}
    <TroopsEditor bind:troops={garrison} ownTown={faction} label={t('townDialog.tab.garrison')} />
    <p class="hint">{t('garrison.hint')}</p>
  {:else}
    <TownGuildTab
      bind:chosen
      {openedGuild}
      {capacities}
      factionIndex={original.faction}
      guildMax={buildings.guildMax}
    />
  {/if}
</EditorDialog>

{#if presetWindow}
  <TownPresetDialog
    mode={presetWindow}
    town={original}
    {faction}
    {buildings}
    have={haveSet}
    {garrison}
    {chosen}
    {locked}
    capacities={capacitiesFor}
    onload={loadPreset}
    onclose={() => (presetWindow = null)}
  />
{/if}

<Dialog bind:open={confirmOpen} title={t('townDialog.applyTitle')} size="small">
  <WarningNote text={t('town.notStudiedHint')} />
  <p class="hint">{t('townDialog.applyText')}</p>
  {#snippet footer()}
    <Button onclick={() => (confirmOpen = false)}>{t('common.cancel')}</Button>
    <Button variant="primary" icon="check" onclick={apply}>{t('editor.apply')}</Button>
  {/snippet}
</Dialog>

<style>
  .hint {
    margin: var(--space-3) 0 0;
    font-size: 13px;
    color: var(--color-text-muted);
  }
</style>
