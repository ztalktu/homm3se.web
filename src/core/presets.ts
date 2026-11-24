/**
 * Presets: parts of a hero, a town or a treasury saved under a name to be loaded onto another
 * one, maybe in a save of another edition. Loading keeps only what the target save can hold;
 * the rest is reported as skipped.
 */

import { artifactById, isHotaArtifact } from '../data/artifacts';
import { buildingKind, BUILDING, type FactionBuildings } from '../data/buildings';
import { creatureById, isHotaCreature } from '../data/creatures';
import { isAvailableIn, type Edition } from '../data/editions';
import { SPELL_BOOK_SLOT, WORN_SLOTS } from '../data/equipment';
import { MAX_SECONDARY_SKILLS } from '../data/skills';
import { GUILD_SPELL_CHANCES, SPELLS } from '../data/spells';
import { fitsSlot } from './equipment';
import type { Hero, Troop } from './hero';
import { COMMON_HERO_FIELDS } from './layouts';
import {
  artifactAllowed,
  BLOCKED_ARTIFACT_IDS,
  classAllowed,
  creatureProblem,
  HERO_LIMITS,
  maxLevel,
  maxPrimarySkill,
  skillAllowed,
  type SaveLimits,
} from './rules';
import { knownBuildings, prerequisites } from './townBuildings';

/** Hero fields saved and loaded one by one, in the order the window lists them. */
export const HERO_ATTRIBUTES = [
  'name',
  'classId',
  'level',
  'experience',
  'attack',
  'defense',
  'spellPower',
  'knowledge',
  'mana',
  'movementPoints',
  'maxMovementPoints',
] as const;
export type HeroAttribute = (typeof HERO_ATTRIBUTES)[number];

/** Hero window tabs saved and loaded as a whole. */
export const HERO_SECTIONS = ['troops', 'skills', 'equipment', 'backpack', 'spells'] as const;
export type HeroSection = (typeof HERO_SECTIONS)[number];

export interface HeroPresetData {
  attributes?: Partial<Pick<Hero, HeroAttribute>>;
  troops?: (Troop | null)[];
  skills?: Hero['secondarySkills'];
  /** Worn artifacts and war machines by slot, as `Hero.equipment`. */
  equipment?: (number | null)[];
  backpack?: number[];
  /** The spell book goes with the spells, as in the 2.05 editor. */
  spells?: { spells: number[]; hasSpellBook: boolean };
}

/** What has to be loaded, and whether the backpack and the spells add to the hero's or replace them. */
export interface HeroPresetChoice {
  attributes: readonly HeroAttribute[];
  sections: readonly HeroSection[];
  backpack: 'add' | 'replace';
  spells: 'add' | 'replace';
}

/** The save the preset was taken from and the one it goes to. */
export interface PresetTarget {
  from: Edition;
  to: Edition;
  limits: SaveLimits;
}

/** Something of the preset the target save cannot hold; ids as the preset's edition has them. */
export interface SkippedItem {
  kind: 'class' | 'creature' | 'skill' | 'artifact' | 'spell';
  id: number;
}

export interface HeroPresetResult {
  hero: Hero;
  skipped: SkippedItem[];
  /** Worn artifacts that came off: the caller puts them into the backpack or deletes them. */
  takenOff: number[];
}

type IdTable = {
  byId: (id: number, edition: Edition) => unknown;
  isHota: (id: number, edition: Edition) => boolean;
};

/**
 * Whether an id of a `from` save means the same creature or artifact in a `to` save: Horn of the
 * Abyss gives the numbers above The Shadow of Death to its own, In the Wake of Gods to others.
 */
function sameMeaning(table: IdTable, id: number, { from, to }: PresetTarget): boolean {
  return (
    table.byId(id, from) !== undefined &&
    table.byId(id, to) !== undefined &&
    table.isHota(id, from) === table.isHota(id, to)
  );
}

const CREATURES = { byId: creatureById, isHota: isHotaCreature };
const ARTIFACTS = { byId: artifactById, isHota: isHotaArtifact };

function creatureFits(id: number, target: PresetTarget): boolean {
  return (
    sameMeaning(CREATURES, id, target) && creatureProblem(id, target.to, target.limits) === null
  );
}

function artifactFits(id: number, target: PresetTarget): boolean {
  return sameMeaning(ARTIFACTS, id, target) && artifactAllowed(id, target.to);
}

function spellFits(id: number, edition: Edition): boolean {
  const spell = SPELLS[id];
  return spell !== undefined && isAvailableIn(spell.introducedIn, edition);
}

const clamp = (value: number, max: number, min = 0): number =>
  Math.min(Math.max(Math.trunc(value), min), max);

/** The chosen parts of a hero, to be saved as a preset. */
export function heroPresetData(
  hero: Hero,
  attributes: readonly HeroAttribute[],
  sections: readonly HeroSection[],
): HeroPresetData {
  const data: HeroPresetData = {};
  if (attributes.length > 0) {
    data.attributes = Object.fromEntries(attributes.map((field) => [field, hero[field]]));
  }
  const has = (section: HeroSection): boolean => sections.includes(section);
  if (has('troops')) {
    data.troops = structuredClone(hero.troops);
  }
  if (has('skills')) {
    data.skills = structuredClone(hero.secondarySkills);
  }
  if (has('equipment')) {
    data.equipment = [...hero.equipment];
  }
  if (has('backpack')) {
    data.backpack = [...hero.backpack];
  }
  if (has('spells')) {
    data.spells = { spells: [...hero.spells], hasSpellBook: hero.hasSpellBook };
  }
  return data;
}

/** Garrison or army slots: each slot of the preset replaces the slot of the hero or town. */
function loadTroops(
  current: readonly (Troop | null)[],
  saved: readonly (Troop | null)[],
  target: PresetTarget,
  skipped: SkippedItem[],
): (Troop | null)[] {
  return current.map((troop, slot) => {
    const next = saved[slot] ?? null;
    if (next === null) {
      return null;
    }
    if (!creatureFits(next.creatureId, target)) {
      skipped.push({ kind: 'creature', id: next.creatureId });
      return troop;
    }
    return { creatureId: next.creatureId, count: clamp(next.count, HERO_LIMITS.troopCount, 1) };
  });
}

function loadAttributes(
  hero: Hero,
  saved: NonNullable<HeroPresetData['attributes']>,
  fields: readonly HeroAttribute[],
  target: PresetTarget,
  skipped: SkippedItem[],
): void {
  const skillCap = maxPrimarySkill(target.to);
  const caps: Record<Exclude<HeroAttribute, 'name' | 'classId'>, [number, number]> = {
    level: [maxLevel(target.to), 1],
    experience: [HERO_LIMITS.experience, 0],
    attack: [skillCap, 0],
    defense: [skillCap, 0],
    spellPower: [skillCap, 0],
    knowledge: [skillCap, 0],
    mana: [HERO_LIMITS.mana, 0],
    movementPoints: [HERO_LIMITS.movementPoints, 0],
    maxMovementPoints: [HERO_LIMITS.movementPoints, 0],
  };
  for (const field of fields) {
    const value = saved[field];
    if (value === undefined) {
      continue;
    }
    if (field === 'name') {
      hero.name = String(value);
    } else if (field === 'classId') {
      if (classAllowed(Number(value), target.to, target.limits)) {
        hero.classId = Number(value);
      } else {
        skipped.push({ kind: 'class', id: Number(value) });
      }
    } else {
      const [max, min] = caps[field];
      hero[field] = clamp(Number(value), max, min);
    }
  }
}

/**
 * Worn artifacts and war machines: the preset's ones replace the hero's. A slot the target save
 * does not have (the fifth misc slot before The Shadow of Death) or an artifact that does not fit
 * is skipped.
 */
function loadEquipment(
  current: readonly (number | null)[],
  saved: readonly (number | null)[],
  target: PresetTarget,
  skipped: SkippedItem[],
): { equipment: (number | null)[]; takenOff: number[] } {
  const equipment = current.map((_, slot) => {
    const id = saved[slot] ?? null;
    if (id === null || slot === SPELL_BOOK_SLOT) {
      return null;
    }
    const fits =
      sameMeaning(ARTIFACTS, id, target) &&
      !BLOCKED_ARTIFACT_IDS.includes(id) &&
      fitsSlot(id, slot, target.to);
    if (!fits) {
      skipped.push({ kind: 'artifact', id });
    }
    return fits ? id : null;
  });
  saved.slice(current.length).forEach((id) => {
    if (id !== null) {
      skipped.push({ kind: 'artifact', id });
    }
  });
  // Worn artifacts that are not on the hero any more; war machines just come and go.
  const remaining = WORN_SLOTS.map(({ index }) => equipment[index] ?? null);
  const takenOff: number[] = [];
  for (const { index } of WORN_SLOTS) {
    const id = current[index] ?? null;
    if (id === null) {
      continue;
    }
    const kept = remaining.indexOf(id);
    if (kept >= 0) {
      remaining[kept] = null;
    } else {
      takenOff.push(id);
    }
  }
  return { equipment, takenOff };
}

/** The hero with the chosen parts of a preset loaded onto it. */
export function applyHeroPreset(
  current: Hero,
  data: HeroPresetData,
  choice: HeroPresetChoice,
  target: PresetTarget,
): HeroPresetResult {
  const hero = structuredClone(current);
  const skipped: SkippedItem[] = [];
  let takenOff: number[] = [];
  const has = (section: HeroSection): boolean => choice.sections.includes(section);

  if (data.attributes) {
    loadAttributes(hero, data.attributes, choice.attributes, target, skipped);
  }
  if (has('troops') && data.troops) {
    hero.troops = loadTroops(hero.troops, data.troops, target, skipped);
  }
  if (has('skills') && data.skills) {
    const seen = new Set<number>();
    hero.secondarySkills = data.skills
      .filter(({ skillId }) => {
        if (!skillAllowed(skillId, target.to, target.limits)) {
          skipped.push({ kind: 'skill', id: skillId });
          return false;
        }
        const first = !seen.has(skillId);
        seen.add(skillId);
        return first;
      })
      .map((skill) => ({ ...skill }))
      .slice(0, MAX_SECONDARY_SKILLS);
  }
  if (has('backpack') && data.backpack) {
    const fitting = data.backpack.filter((id) => {
      const fits = artifactFits(id, target);
      if (!fits) {
        skipped.push({ kind: 'artifact', id });
      }
      return fits;
    });
    const base = choice.backpack === 'add' ? hero.backpack : [];
    hero.backpack = [...base, ...fitting].slice(0, COMMON_HERO_FIELDS.backpackSlots);
  }
  if (has('equipment') && data.equipment) {
    const loaded = loadEquipment(hero.equipment, data.equipment, target, skipped);
    hero.equipment = loaded.equipment;
    takenOff = loaded.takenOff;
  }
  if (has('spells') && data.spells) {
    const fitting = data.spells.spells.filter((id) => {
      const fits = spellFits(id, target.to);
      if (!fits) {
        skipped.push({ kind: 'spell', id });
      }
      return fits;
    });
    const base = choice.spells === 'add' ? hero.spells : [];
    hero.spells = [...new Set([...base, ...fitting])].sort((a, b) => a - b);
    // As in the 2.05 editor, a preset can give the book but never takes it away.
    hero.hasSpellBook ||= data.spells.hasSpellBook;
  }
  return { hero, skipped, takenOff };
}

// ---------- towns ----------

export const TOWN_SECTIONS = ['buildings', 'garrison', 'guild'] as const;
export type TownSection = (typeof TOWN_SECTIONS)[number];

export interface TownPresetData {
  /** The faction of the town it was taken from (an index in TOWNS). */
  faction: number;
  /** Built buildings, as the full mask holds them. */
  buildings?: number[];
  garrison?: (Troop | null)[];
  /** Spells of the guild levels 1–5. */
  guild?: number[][];
}

/** Kinds of buildings that mean the same in every faction. */
const SHARED_KINDS = new Set([
  'mageGuild',
  'tavern',
  'shipyard',
  'fort',
  'townHall',
  'market',
  'blacksmith',
  'grail',
  'dwelling',
]);

/** Whether a building id means the same building in both factions. */
function sharedBuilding(
  id: number,
  from: { faction: number; buildings: FactionBuildings },
  to: { faction: number; buildings: FactionBuildings },
): boolean {
  const before = buildingKind(id, from.faction, from.buildings);
  const after = buildingKind(id, to.faction, to.buildings);
  const extra = (buildings: FactionBuildings): boolean =>
    buildings.extraDwellings?.[id] !== undefined;
  return (
    SHARED_KINDS.has(before.kind) &&
    before.kind === after.kind &&
    !extra(from.buildings) &&
    !extra(to.buildings)
  );
}

export interface TownBuildingsResult {
  buildings: Set<number>;
  /** Buildings of the preset's faction left out. */
  skipped: number[];
}

/**
 * The preset's buildings for a town: with what they need, the Village Hall always. A preset of
 * another faction brings only the buildings every town has; the town keeps its own special
 * buildings as long as what they need still stands. `locked` buildings (a Capitol another town
 * of the player has) are left out.
 */
export function townPresetBuildings(
  current: ReadonlySet<number>,
  saved: readonly number[],
  from: { faction: number; buildings: FactionBuildings | undefined },
  to: { faction: number; buildings: FactionBuildings },
  locked: ReadonlySet<number>,
): TownBuildingsResult {
  const known = new Set(knownBuildings(to.buildings));
  const sameFaction = from.faction === to.faction;
  const source = from.buildings;
  const skipped: number[] = [];
  const result = new Set<number>([BUILDING.villageHall]);
  for (const id of saved) {
    const fits =
      known.has(id) &&
      !locked.has(id) &&
      (sameFaction ||
        (source !== undefined &&
          sharedBuilding(id, { faction: from.faction, buildings: source }, to)));
    if (!fits) {
      skipped.push(id);
      continue;
    }
    result.add(id);
    prerequisites(id, to.buildings).forEach((need) => result.add(need));
  }
  if (!sameFaction) {
    const own = [...current].filter(
      (id) =>
        source === undefined ||
        !sharedBuilding(id, { faction: from.faction, buildings: source }, to),
    );
    // Drop the special buildings whose requirements did not come back, until none is left.
    let kept = own;
    for (;;) {
      const all = new Set([...result, ...kept]);
      const next = kept.filter((id) =>
        [...prerequisites(id, to.buildings)].every((need) => all.has(need)),
      );
      if (next.length === kept.length) {
        break;
      }
      kept = next;
    }
    kept.forEach((id) => result.add(id));
  }
  return { buildings: result, skipped };
}

export function townPresetGarrison(
  current: readonly (Troop | null)[],
  saved: readonly (Troop | null)[],
  target: PresetTarget,
): { garrison: (Troop | null)[]; skipped: number[] } {
  const skipped: SkippedItem[] = [];
  const garrison = loadTroops(current, saved, target, skipped);
  return { garrison, skipped: skipped.map(({ id }) => id) };
}

/**
 * The preset's guild spells, level by level, without those the faction's guild never has or the
 * save does not know; the caller fills the levels up to their slots.
 */
export function townPresetGuild(
  saved: readonly (readonly number[])[],
  faction: number,
  edition: Edition,
): { guild: number[][]; skipped: number[] } {
  const chances = GUILD_SPELL_CHANCES[faction] ?? [];
  const skipped: number[] = [];
  const guild = saved.slice(0, 5).map((row, level) =>
    [...new Set(row)].filter((id) => {
      const fits =
        spellFits(id, edition) && SPELLS[id]?.level === level + 1 && (chances[id] ?? 0) > 0;
      if (!fits) {
        skipped.push(id);
      }
      return fits;
    }),
  );
  return { guild, skipped };
}
