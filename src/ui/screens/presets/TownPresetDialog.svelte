<script lang="ts" module>
  import type { Troop } from '../../../core/hero';

  /** What loading gives the window; a part left out stays as it is. */
  export interface TownPresetLoad {
    buildings?: Set<number> | undefined;
    garrison?: (Troop | null)[] | undefined;
    /** Spells by guild level, before the free places are filled. */
    guild?: number[][] | undefined;
  }
</script>

<script lang="ts">
  /**
   * Saving the town of the window as a preset, or loading one onto it: buildings, garrison and
   * mage guild, each as a whole. A preset of another faction brings only the buildings every
   * town has and the guild spells this faction's guild can have.
   */
  import { presetsOf, savePreset, type Preset } from '../../../app/presets.svelte';
  import { saveLimits, session } from '../../../app/session.svelte';
  import { showToast } from '../../../app/toasts.svelte';
  import { factionBuildings, type FactionBuildings } from '../../../data/buildings';
  import { TOWNS, type Town as Faction } from '../../../data/creatures';
  import type { Edition } from '../../../data/editions';
  import {
    TOWN_SECTIONS,
    townPresetBuildings,
    townPresetGarrison,
    townPresetGuild,
    type TownPresetData,
    type TownSection,
  } from '../../../core/presets';
  import type { Town } from '../../../core/town';
  import {
    buildingName,
    creatureName,
    editionName,
    spellName,
    townName,
  } from '../../../i18n/game.svelte';
  import { t, type MessageKey } from '../../../i18n/index.svelte';
  import type { TooltipList } from '../../actions/tooltip';
  import Fieldset from '../../components/Fieldset.svelte';
  import type { IconName } from '../../components/icons';
  import { formatDate } from '../../format';
  import WarningNote from '../shared/WarningNote.svelte';
  import { hint, listRows, skippedGroup, slotRows, troopLabel, troopSlotLabels } from './hints';
  import PresetDialog from './PresetDialog.svelte';
  import PresetSection from './PresetSection.svelte';

  interface Props {
    mode: 'save' | 'load';
    town: Town;
    faction: Faction;
    buildings: FactionBuildings;
    /** The window's draft. */
    have: ReadonlySet<number>;
    garrison: readonly (Troop | null)[];
    chosen: readonly (readonly number[])[];
    /** Buildings the town may not get (a Capitol another town of the player has). */
    locked: ReadonlySet<number>;
    /** Spell places of each guild level with these buildings. */
    capacities: (have: ReadonlySet<number>) => number[];
    onload: (load: TownPresetLoad) => void;
    onclose: () => void;
  }

  let {
    mode,
    town,
    faction,
    buildings,
    have,
    garrison,
    chosen,
    locked,
    capacities,
    onload,
    onclose,
  }: Props = $props();

  let open = $state(true);
  $effect(() => {
    if (!open) {
      onclose();
    }
  });

  const SECTIONS: Record<TownSection, { label: MessageKey; icon: IconName }> = {
    buildings: { label: 'townDialog.tab.buildings', icon: 'town' },
    garrison: { label: 'townDialog.tab.garrison', icon: 'troops' },
    guild: { label: 'townDialog.tab.guild', icon: 'spells' },
  };

  const edition = $derived(session.edition);
  const presets = $derived(presetsOf('town'));
  // svelte-ignore state_referenced_locally
  let name = $state(
    mode === 'save'
      ? t('preset.defaultName', {
          name: t('preset.townName', { name: town.name, faction: townName(faction) }),
          date: formatDate(Date.now()),
        })
      : (presetsOf('town')[0]?.name ?? ''),
  );
  let sections: Record<TownSection, boolean> = $state({
    buildings: true,
    garrison: true,
    guild: true,
  });

  const current = $derived<TownPresetData>({
    faction: town.faction,
    buildings: [...have].sort((a, b) => a - b),
    garrison: [...garrison],
    guild: chosen.map((row) => [...row]),
  });
  const preset: Preset<'town'> | undefined = $derived(
    mode === 'load' ? presets.find((known) => known.name === name) : undefined,
  );
  const shown = $derived(preset?.data ?? current);
  const shownEdition: Edition = $derived(preset?.edition ?? edition);
  const shownFaction = $derived(TOWNS[shown.faction]);
  const otherFaction = $derived(shown.faction !== town.faction);
  const target = $derived({ from: shownEdition, to: edition, limits: saveLimits() });

  const hasSection = (section: TownSection): boolean => shown[section] !== undefined;
  const chosenSections = $derived(TOWN_SECTIONS.filter((s) => sections[s] && hasSection(s)));

  // ---------- what loading gives ----------

  const loadedBuildings = $derived(
    preset?.data.buildings &&
      townPresetBuildings(
        have,
        preset.data.buildings,
        {
          faction: preset.data.faction,
          buildings: factionBuildings(preset.data.faction, preset.edition),
        },
        { faction: town.faction, buildings },
        locked,
      ),
  );
  const loadedGarrison = $derived(
    preset?.data.garrison && townPresetGarrison(garrison, preset.data.garrison, target),
  );
  const loadedGuild = $derived(
    preset?.data.guild && townPresetGuild(preset.data.guild, town.faction, edition),
  );

  /** Buildings after the load: the preset's when they are loaded, else the window's. */
  const haveAfter = $derived(
    sections.buildings && loadedBuildings ? loadedBuildings.buildings : have,
  );

  // ---------- names, summaries and hints ----------

  const buildingNames = (ids: Iterable<number>, of: Faction | undefined): string[] =>
    [...ids].sort((a, b) => a - b).map((id) => (of ? buildingName(of, id) : String(id)));
  const levelLabel = (level: number): string => t('preset.guildLevel', { level: level + 1 });

  function summary(section: TownSection, data: TownPresetData, from: Edition): string {
    switch (section) {
      case 'buildings':
        return t('preset.buildings', { count: data.buildings?.length ?? 0 });
      case 'garrison':
        return (data.garrison ?? []).flatMap((troop) => troopLabel(troop, from) ?? []).join(', ');
      case 'guild': {
        const levels = (data.guild ?? []).filter((row) => row.length > 0);
        return t('preset.guildSummary', {
          levels: levels.length,
          count: levels.reduce((sum, row) => sum + row.length, 0),
        });
      }
    }
  }

  function guildGroups(
    after: readonly (readonly number[])[],
    before?: readonly (readonly number[])[],
  ): TooltipList['groups'] {
    return after.flatMap((row, level) => {
      const rows = listRows(row.map(spellName), before?.[level]?.map(spellName));
      return rows.length > 0 ? [{ label: levelLabel(level), rows }] : [];
    });
  }

  function saveHint(section: TownSection): TooltipList {
    const title = t(SECTIONS[section].label);
    switch (section) {
      case 'buildings':
        return hint(title, [{ rows: listRows(buildingNames(have, faction)) }]);
      case 'garrison':
        return hint(title, [
          {
            rows: slotRows(
              troopSlotLabels(),
              garrison.map((troop) => troopLabel(troop, edition)),
            ),
          },
        ]);
      case 'guild':
        return hint(title, guildGroups(chosen));
    }
  }

  function loadHint(section: TownSection): TooltipList | undefined {
    const title = t(SECTIONS[section].label);
    switch (section) {
      case 'buildings': {
        if (!loadedBuildings || !preset) {
          return undefined;
        }
        const skippedNames = buildingNames(loadedBuildings.skipped, shownFaction);
        return hint(
          title,
          [
            {
              rows: listRows(
                buildingNames(loadedBuildings.buildings, faction),
                buildingNames(have, faction),
              ),
            },
            ...skippedGroup(
              skippedNames,
              otherFaction && shownFaction
                ? t('preset.factionOnly', { faction: townName(shownFaction) })
                : undefined,
            ),
          ],
          t('preset.whole'),
          t('preset.requirementsBuilt'),
        );
      }
      case 'garrison':
        if (!loadedGarrison) {
          return undefined;
        }
        return hint(
          title,
          [
            {
              rows: slotRows(
                troopSlotLabels(),
                loadedGarrison.garrison.map((troop) => troopLabel(troop, edition)),
                garrison.map((troop) => troopLabel(troop, edition)),
              ),
            },
            ...skippedGroup(loadedGarrison.skipped.map((id) => creatureName(id, shownEdition))),
          ],
          t('preset.bySlot'),
        );
      case 'guild': {
        if (!loadedGuild) {
          return undefined;
        }
        const places = capacities(haveAfter);
        const after = loadedGuild.guild.map((row, level) => row.slice(0, places[level] ?? 0));
        return hint(
          title,
          [
            ...guildGroups(after, chosen),
            ...skippedGroup(loadedGuild.skipped.map(spellName), t('preset.guildNotHere')),
          ],
          t('preset.whole'),
          t('preset.guildFilled'),
        );
      }
    }
  }

  /** Creatures the save cannot hold, for the note under the columns. */
  const skippedNames = $derived(
    sections.garrison
      ? [...new Set((loadedGarrison?.skipped ?? []).map((id) => creatureName(id, shownEdition)))]
      : [],
  );

  const canApply = $derived(
    (mode === 'save' ? name.trim() !== '' : preset !== undefined) && chosenSections.length > 0,
  );

  function apply(): void {
    if (mode === 'save') {
      const presetName = name.trim();
      const data: TownPresetData = { faction: town.faction };
      for (const section of chosenSections) {
        Object.assign(data, { [section]: $state.snapshot(current[section]) });
      }
      savePreset('town', { name: presetName, savedAt: Date.now(), edition, data });
      showToast(t('preset.saved', { name: presetName }), { kind: 'success' });
    } else {
      const has = (section: TownSection): boolean => chosenSections.includes(section);
      onload({
        buildings: has('buildings') ? loadedBuildings?.buildings : undefined,
        garrison: has('garrison') ? loadedGarrison?.garrison : undefined,
        guild: has('guild') ? loadedGuild?.guild : undefined,
      });
    }
    open = false;
  }
</script>

<PresetDialog
  bind:open
  kind="town"
  {mode}
  bind:name
  describe={(known) => {
    const of = TOWNS[known.data.faction];
    return of && townName(of);
  }}
  {canApply}
  onapply={apply}
>
  <Fieldset legend={t(mode === 'save' ? 'preset.whatToSave' : 'preset.whatToLoad')}>
    <div class="sections">
      {#each TOWN_SECTIONS as section (section)}
        <PresetSection
          label={t(SECTIONS[section].label)}
          icon={SECTIONS[section].icon}
          bind:checked={sections[section]}
          available={hasSection(section)}
          summary={summary(section, shown, shownEdition)}
          hint={hasSection(section) ? (preset ? loadHint(section) : saveHint(section)) : undefined}
        />
      {/each}
    </div>
  </Fieldset>

  {#snippet notes()}
    {#if mode === 'load'}
      {#if otherFaction && shownFaction && sections.buildings && hasSection('buildings')}
        <WarningNote text={t('preset.otherFaction', { faction: townName(shownFaction) })} />
      {/if}
      {#if skippedNames.length > 0}
        <WarningNote
          text={t('preset.otherEdition', {
            edition: editionName(shownEdition),
            names: skippedNames.join(', '),
          })}
        />
      {/if}
    {/if}
  {/snippet}
</PresetDialog>

<style>
  .sections {
    display: grid;
    gap: var(--space-3);
  }
</style>
