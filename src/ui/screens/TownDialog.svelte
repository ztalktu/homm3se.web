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
  import type { FactionBuildings } from '../../data/buildings';
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

  const haveSet = $derived(new Set(have));
  const buildingsChanged = $derived(!sameBuildings(haveSet, opened));
  /** Unchanged buildings keep the guild's slots as the file has them. */
  const capacities = $derived(
    buildingsChanged ? guildCapacities(haveSet, original.faction) : original.guildSlots,
  );

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

  /** A building change from the Buildings tab; guild levels follow their buildings. */
  function changeBuildings(change: BuildingChange): void {
    have = [...change.buildings].sort((a, b) => a - b);
    chosen = sameBuildings(change.buildings, opened)
      ? openedGuild.map((row) => [...row])
      : fillGuild(chosen, guildCapacities(change.buildings, original.faction), original.faction);
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
  {#if activeTab === 'buildings'}
    <TownBuildingsTab
      have={haveSet}
      {opened}
      town={original}
      {faction}
      {buildings}
      {capitolTown}
      onchange={changeBuildings}
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
