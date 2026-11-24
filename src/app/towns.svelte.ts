/**
 * The towns of the open save for the Towns tab: the list with its filters, the picked town, who
 * stands in it, and "Apply" for the town editor.
 */

import { BUILDING, factionBuildings, type FactionBuildings } from '../data/buildings';
import { TOWNS, type Town as Faction } from '../data/creatures';
import { PLAYER_COLORS, type PlayerColor } from '../data/players';
import { hasTownChanges, townChanges, type TownChanges } from '../core/changes';
import { heroLayoutAt, layoutFor, type TownLayout } from '../core/layouts';
import type { SaveBuffer } from '../core/saveBuffer';
import type { SaveGame } from '../core/saveGame';
import {
  findTownPositions,
  isHeroInTown,
  readHeroPlace,
  readTown,
  writeTown,
  type Town,
} from '../core/town';
import { t } from '../i18n/index.svelte';
import { session } from './session.svelte';
import { showToast } from './toasts.svelte';

interface TownTabState {
  /** The only owner the list shows (null: neutral towns), or undefined when the filter is off. */
  ownerFilter: PlayerColor | null | undefined;
  /** The only faction the list shows, or undefined. */
  factionFilter: Faction | undefined;
  /** Part of a name the list must contain. */
  nameFilter: string;
  /** Record position of the picked town; a town of another save is ignored. */
  selected: number | null;
}

export const townTab: TownTabState = $state({
  ownerFilter: undefined,
  factionFilter: undefined,
  nameFilter: '',
  selected: null,
});

/**
 * Town positions do not move when a town is edited, so they are found once per save and layout
 * (an unknown header follows the edition the user picks).
 */
const positionsBySave = new WeakMap<SaveGame, { layout: TownLayout; positions: number[] }>();

function townLayout(save: SaveGame): TownLayout {
  return layoutFor(save.format, session.edition).town;
}

function townPositions(save: SaveGame): number[] {
  const layout = townLayout(save);
  const known = positionsBySave.get(save);
  if (known?.layout === layout) {
    return known.positions;
  }
  const positions = findTownPositions(save.buffer, layout);
  positionsBySave.set(save, { layout, positions });
  return positions;
}

function readTowns(save: SaveGame, buffer: SaveBuffer): Town[] {
  const layout = townLayout(save);
  return townPositions(save).map((position) => readTown(buffer, position, layout));
}

/** Every town of the open save, in file order. Reactive through `revision`. */
export function townsInSave(): Town[] {
  void session.revision;
  const save = session.save;
  return save ? readTowns(save, save.buffer) : [];
}

/** True when the town records of the open save's layout were checked on enough saves. */
export function townsFullyStudied(): boolean {
  const save = session.save;
  return save ? townLayout(save).fullyStudied : true;
}

/** The faction name key of a town record, or undefined for a code the editor does not know. */
export function townFaction(town: Town): Faction | undefined {
  return TOWNS[town.faction];
}

export function townBuildingsData(town: Town): FactionBuildings | undefined {
  return factionBuildings(town.faction, session.edition);
}

/** Owners of the towns in the save (null: neutral towns), in player order, neutral last. */
export function townOwnersInSave(): (PlayerColor | null)[] {
  const owners = townsInSave().map((town) => town.owner);
  return [...PLAYER_COLORS, null].filter((owner) => owners.includes(owner));
}

export function townFactionsInSave(): Faction[] {
  const factions = townsInSave().map(townFaction);
  return TOWNS.filter((faction) => factions.includes(faction));
}

/** Towns left by the filters. */
export function townsInList(): Town[] {
  const { ownerFilter, factionFilter, nameFilter } = townTab;
  const part = nameFilter.trim().toLocaleLowerCase();
  return townsInSave().filter(
    (town) =>
      (ownerFilter === undefined || town.owner === ownerFilter) &&
      (factionFilter === undefined || townFaction(town) === factionFilter) &&
      (part === '' || town.name.toLocaleLowerCase().includes(part)),
  );
}

/** Like the other single-choice filters: a click shows only that owner, a second shows all. */
export function filterTownsByOwner(owner: PlayerColor | null): void {
  townTab.ownerFilter = townTab.ownerFilter === owner ? undefined : owner;
}

export function filterTownsByFaction(faction: Faction): void {
  townTab.factionFilter = townTab.factionFilter === faction ? undefined : faction;
}

/** The picked town if the list shows it, else the list's first; null for an empty list. */
export function selectedTown(): Town | null {
  const list = townsInList();
  return list.find((town) => town.position === townTab.selected) ?? list[0] ?? null;
}

export function selectTown(position: number): void {
  townTab.selected = position;
}

/** Heroes standing in the town: in its garrison and visiting; names of known heroes only. */
export function heroesInTown(town: Town): { garrison: string[]; visitors: string[] } {
  const save = session.save;
  const result = { garrison: [] as string[], visitors: [] as string[] };
  if (!save) {
    return result;
  }
  for (const [name, hero] of session.heroNamesInSave ?? []) {
    for (const position of hero.positions) {
      const layout = heroLayoutAt(save.format, session.edition, save.buffer, position);
      const place = readHeroPlace(save.buffer, position, layout);
      if (place && isHeroInTown(place, town)) {
        (place.onMap ? result.visitors : result.garrison).push(name);
      }
    }
  }
  return result;
}

/** Another town of the same player that has the Capitol: a player can have only one. */
export function capitolElsewhere(town: Town): Town | undefined {
  if (town.owner === null) {
    return undefined;
  }
  const capitol = 1n << BigInt(BUILDING.capitol);
  return townsInSave().find(
    (other) =>
      other.position !== town.position &&
      other.owner === town.owner &&
      (other.builtAll & capitol) !== 0n,
  );
}

export function applyTown(town: Town): void {
  const save = session.save;
  if (!save) {
    return;
  }
  save.edit((buffer) => writeTown(buffer, town));
  if (!session.edited.towns.includes(town.position)) {
    session.edited.towns.push(town.position);
  }
  session.revision += 1;
  showToast(t('message.townChanged'), { kind: 'success' });
}

export interface EditedTownChanges {
  name: string;
  faction: Faction | undefined;
  owner: PlayerColor | null;
  changes: TownChanges;
}

/** Changes of every edited town since the save was opened, for the info page. */
export function townChangeSummary(): EditedTownChanges[] {
  void session.revision;
  const save = session.save;
  if (!save) {
    return [];
  }
  const layout = townLayout(save);
  const saved = save.savedBuffer;
  return session.edited.towns.flatMap((position) => {
    const before = readTown(save.originalBuffer, position, layout);
    const after = readTown(save.buffer, position, layout);
    const changes = townChanges(before, after, saved && readTown(saved, position, layout));
    return hasTownChanges(changes)
      ? [{ name: after.name, faction: townFaction(after), owner: after.owner, changes }]
      : [];
  });
}
