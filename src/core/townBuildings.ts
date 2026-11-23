/**
 * What building or demolishing does to a town: requirements pulled in, buildings that fall with
 * what they stand on, the two building masks, and the mage guild that follows its levels.
 *
 * The editor works with the set of built buildings as the full mask holds it (an upgrade and what
 * it replaces both in it); `buildingMasks` turns the set back into the two masks of the save.
 */

import { BUILDING, type FactionBuildings } from '../data/buildings';
import { GUILD_SPELL_CHANCES, SPELLS } from '../data/spells';
import type { Town } from './town';

const TOWER = 2;
const LIBRARY = 22;
/** Spells of guild levels 1–5 without a library. */
const GUILD_LEVEL_SLOTS = [5, 4, 3, 2, 1] as const;

function bit(id: number): bigint {
  return 1n << BigInt(id);
}

/** Every building the faction has: the hall slots, the Grail and the Village Hall. */
function knownBuildings(buildings: FactionBuildings): number[] {
  const ids = new Set<number>([BUILDING.villageHall, BUILDING.grail]);
  for (const row of buildings.hall) {
    for (const chain of row) {
      chain.forEach((id) => ids.add(id));
    }
  }
  return [...ids].sort((a, b) => a - b);
}

/** The town's buildings the faction knows, as the full mask has them. */
export function townBuildings(town: Town, buildings: FactionBuildings): Set<number> {
  return new Set(knownBuildings(buildings).filter((id) => (town.builtAll & bit(id)) !== 0n));
}

/** Everything `id` needs, directly or through other buildings; the Village Hall always stands. */
export function prerequisites(id: number, buildings: FactionBuildings): Set<number> {
  const result = new Set<number>();
  const pending = [...(buildings.requires[id] ?? [])];
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    if (!result.has(next)) {
      result.add(next);
      pending.push(...(buildings.requires[next] ?? []));
    }
  }
  return result;
}

/** The buildings of `have` that need one of `removed`, directly or through others. */
function dependants(
  removed: Iterable<number>,
  have: ReadonlySet<number>,
  buildings: FactionBuildings,
): Set<number> {
  const gone = new Set(removed);
  const result = new Set<number>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of have) {
      if (gone.has(id)) {
        continue;
      }
      if ((buildings.requires[id] ?? []).some((need) => gone.has(need))) {
        gone.add(id);
        result.add(id);
        changed = true;
      }
    }
  }
  return result;
}

export interface BuildingChange {
  /** The buildings after the change. */
  buildings: Set<number>;
  added: number[];
  removed: number[];
}

/** True when both sets hold the same buildings. */
export function sameBuildings(a: ReadonlySet<number>, b: ReadonlySet<number>): boolean {
  return a.size === b.size && [...a].every((id) => b.has(id));
}

function change(before: ReadonlySet<number>, after: Set<number>): BuildingChange {
  return {
    buildings: after,
    added: [...after].filter((id) => !before.has(id)).sort((a, b) => a - b),
    removed: [...before].filter((id) => !after.has(id)).sort((a, b) => a - b),
  };
}

/**
 * Sets a hall slot to `level` (an index into `chain`; -1 demolishes the whole slot): that level
 * and the ones below it stand, with what they need; the higher ones go, with what needs them.
 * The Village Hall cannot be demolished.
 */
export function setSlotLevel(
  have: ReadonlySet<number>,
  chain: readonly number[],
  level: number,
  buildings: FactionBuildings,
): BuildingChange {
  const keep = chain.slice(0, level + 1);
  const drop = chain.slice(level + 1).filter((id) => id !== BUILDING.villageHall);
  const after = new Set(have);
  for (const id of keep) {
    after.add(id);
    prerequisites(id, buildings).forEach((need) => after.add(need));
  }
  for (const id of drop) {
    after.delete(id);
  }
  for (const id of dependants(drop, after, buildings)) {
    after.delete(id);
  }
  return change(have, after);
}

/** Builds or demolishes one building, such as the Grail. */
export function setBuilt(
  have: ReadonlySet<number>,
  id: number,
  built: boolean,
  buildings: FactionBuildings,
): BuildingChange {
  return setSlotLevel(have, [id], built ? 0 : -1, buildings);
}

/** Every building but the Grail (left as it is) and the ones in `excluded`, with what needs them. */
export function buildAll(
  have: ReadonlySet<number>,
  buildings: FactionBuildings,
  excluded: ReadonlySet<number> = new Set(),
): BuildingChange {
  const all = new Set(knownBuildings(buildings).filter((id) => id !== BUILDING.grail));
  for (const id of [...excluded, ...dependants(excluded, all, buildings)]) {
    all.delete(id);
  }
  if (have.has(BUILDING.grail)) {
    all.add(BUILDING.grail);
  }
  return change(have, all);
}

/** Back to the buildings the editor was opened with. */
export function restoreBuildings(
  have: ReadonlySet<number>,
  opened: ReadonlySet<number>,
): BuildingChange {
  return change(have, new Set(opened));
}

/** The least a town can have: the Village Hall. */
export function minimumBuildings(have: ReadonlySet<number>): BuildingChange {
  return change(have, new Set([BUILDING.villageHall]));
}

/**
 * The two masks for a set of buildings. Bits of no known building stay as they were. Unchanged
 * buildings keep both masks as they are, even a first mask with an upgrade and what it replaces.
 */
export function buildingMasks(
  town: Town,
  have: ReadonlySet<number>,
  buildings: FactionBuildings,
): { built: bigint; builtAll: bigint } {
  if (sameBuildings(townBuildings(town, buildings), have)) {
    return { built: town.built, builtAll: town.builtAll };
  }
  const known = knownBuildings(buildings).reduce((mask, id) => mask | bit(id), 0n);
  const replaced = new Set([...have].flatMap((id) => buildings.replaces[id] ?? []));
  let all = 0n;
  let shown = 0n;
  for (const id of have) {
    all |= bit(id);
    if (!replaced.has(id)) {
      shown |= bit(id);
    }
  }
  return { built: (town.built & ~known) | shown, builtAll: (town.builtAll & ~known) | all };
}

/** Spell slots of each guild level for these buildings: 0 for a level not built. */
export function guildCapacities(have: ReadonlySet<number>, faction: number): number[] {
  const library = faction === TOWER && have.has(LIBRARY) ? 1 : 0;
  return GUILD_LEVEL_SLOTS.map((slots, level) =>
    have.has(BUILDING.mageGuild1 + level) ? slots + library : 0,
  );
}

/** Picks a spell of `level` (1–5) for a faction's guild by the game's weights, leaving out `taken`. */
export function randomGuildSpell(
  level: number,
  faction: number,
  taken: ReadonlySet<number>,
  random: () => number = Math.random,
): number | undefined {
  const chances = GUILD_SPELL_CHANCES[faction] ?? [];
  const candidates = SPELLS.filter((spell) => spell.level === level && !taken.has(spell.id)).map(
    (spell) => ({ id: spell.id, weight: chances[spell.id] ?? 0 }),
  );
  const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  if (total === 0) {
    return undefined;
  }
  let roll = random() * total;
  for (const candidate of candidates) {
    roll -= candidate.weight;
    if (roll < 0 && candidate.weight > 0) {
      return candidate.id;
    }
  }
  return candidates.filter((candidate) => candidate.weight > 0).pop()?.id;
}

/**
 * Spells chosen for each guild level, after the buildings changed to give `capacities` slots: a
 * level that gains slots gets random spells of its level; one that loses some keeps its first
 * spells; a level that goes keeps its spells, so building it again brings them back.
 */
export function fillGuild(
  chosen: readonly (readonly number[])[],
  capacities: readonly number[],
  faction: number,
  random: () => number = Math.random,
): number[][] {
  return capacities.map((capacity, level) => {
    const row = [...(chosen[level] ?? [])];
    if (capacity === 0) {
      return row;
    }
    row.length = Math.min(row.length, capacity);
    while (row.length < capacity) {
      const spell = randomGuildSpell(level + 1, faction, new Set(row), random);
      if (spell === undefined) {
        break;
      }
      row.push(spell);
    }
    return row;
  });
}

/** The spells in the slots of each level of the town's guild. */
export function guildChoice(town: Pick<Town, 'guildSlots' | 'guildSpells'>): number[][] {
  return town.guildSpells.map((row, level) => row.slice(0, town.guildSlots[level] ?? 0));
}

/**
 * The guild spell array to write: the chosen spells in the first slots of each level, the slots
 * after them as they were in the file.
 */
export function guildSpellsToWrite(
  town: Pick<Town, 'guildSpells'>,
  chosen: readonly (readonly number[])[],
): number[][] {
  return town.guildSpells.map((row, level) => {
    const next = [...row];
    (chosen[level] ?? []).forEach((spell, slot) => {
      if (slot < next.length) {
        next[slot] = spell;
      }
    });
    return next;
  });
}
