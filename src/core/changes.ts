/**
 * What the user changed in the save: every changed value as opened and as it is now, and
 * whether the last written file already holds the new value.
 */

import type { Hero, Troop } from './hero';
import { RESOURCES, type Resource } from './layouts';
import type { ResourceAmounts } from './resources';
import type { SkillLevel } from '../data/skills';

export interface ValueChange<T> {
  before: T;
  after: T;
  /** The last written file holds `after`. */
  saved: boolean;
}

/** An id that went into or out of a list (backpack, spells), `count` times. */
export interface ListChange {
  id: number;
  added: boolean;
  count: number;
  saved: boolean;
}

/** Plain values of a hero, compared one by one. */
const HERO_ATTRIBUTES = [
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
] as const satisfies readonly (keyof Hero)[];

export type HeroAttribute = (typeof HERO_ATTRIBUTES)[number];

export interface HeroChanges {
  attributes: (ValueChange<string | number> & { attribute: HeroAttribute })[];
  /** By slot: an empty slot is null. */
  troops: (ValueChange<Troop | null> & { slot: number })[];
  /** By skill rather than by slot, since removing a skill moves the ones below it up. */
  skills: (ValueChange<SkillLevel | null> & { skillId: number })[];
  artifacts: ListChange[];
  spellBook: ValueChange<boolean> | null;
  spells: ListChange[];
}

export interface ResourceChange extends ValueChange<number> {
  resource: Resource;
}

function sameTroop(a: Troop | null, b: Troop | null): boolean {
  return (
    a === b || (a !== null && b !== null && a.creatureId === b.creatureId && a.count === b.count)
  );
}

/** The change from `before` to `after`, or null when there is none. */
function valueChange<T>(
  before: T,
  after: T,
  saved: T | undefined,
  same: (a: T, b: T) => boolean = Object.is,
): ValueChange<T> | null {
  if (same(before, after)) {
    return null;
  }
  return { before, after, saved: saved !== undefined && same(saved, after) };
}

function counts(ids: readonly number[]): Map<number, number> {
  const result = new Map<number, number>();
  for (const id of ids) {
    result.set(id, (result.get(id) ?? 0) + 1);
  }
  return result;
}

/** Ids added and removed, counted, so the same artifact twice in the backpack is two. */
function listChanges(
  before: readonly number[],
  after: readonly number[],
  saved: readonly number[] | undefined,
): ListChange[] {
  const had = counts(before);
  const has = counts(after);
  const written = saved && counts(saved);
  const changes: ListChange[] = [];
  for (const id of new Set([...after, ...before])) {
    const now = has.get(id) ?? 0;
    const then = had.get(id) ?? 0;
    if (now !== then) {
      changes.push({
        id,
        added: now > then,
        count: Math.abs(now - then),
        saved: written !== undefined && (written.get(id) ?? 0) === now,
      });
    }
  }
  return changes;
}

function skillLevels(hero: Hero): Map<number, SkillLevel> {
  return new Map(hero.secondarySkills.map((skill) => [skill.skillId, skill.level]));
}

/** Changes from `original` to `current`; `saved` is the hero in the last written file. */
export function heroChanges(original: Hero, current: Hero, saved: Hero | null): HeroChanges {
  const attributes = HERO_ATTRIBUTES.flatMap((attribute) => {
    const change = valueChange(original[attribute], current[attribute], saved?.[attribute]);
    return change ? [{ ...change, attribute }] : [];
  });

  const troops = current.troops.flatMap((troop, slot) => {
    const change = valueChange(
      original.troops[slot] ?? null,
      troop,
      saved ? (saved.troops[slot] ?? null) : undefined,
      sameTroop,
    );
    return change ? [{ ...change, slot }] : [];
  });

  const had = skillLevels(original);
  const has = skillLevels(current);
  const written = saved && skillLevels(saved);
  const skills = [...new Set([...has.keys(), ...had.keys()])].flatMap((skillId) => {
    const change = valueChange(
      had.get(skillId) ?? null,
      has.get(skillId) ?? null,
      written ? (written.get(skillId) ?? null) : undefined,
    );
    return change ? [{ ...change, skillId }] : [];
  });

  return {
    attributes,
    troops,
    skills,
    artifacts: listChanges(original.backpack, current.backpack, saved?.backpack),
    spellBook: valueChange(original.hasSpellBook, current.hasSpellBook, saved?.hasSpellBook),
    spells: listChanges(original.spells, current.spells, saved?.spells),
  };
}

export function hasHeroChanges(changes: HeroChanges): boolean {
  const { attributes, troops, skills, artifacts, spellBook, spells } = changes;
  return (
    spellBook !== null ||
    [attributes, troops, skills, artifacts, spells].some((list) => list.length > 0)
  );
}

/** Changed resources of one treasury; `saved` is the treasury in the last written file. */
export function resourceChanges(
  original: ResourceAmounts,
  current: ResourceAmounts,
  saved: ResourceAmounts | null,
): ResourceChange[] {
  return RESOURCES.flatMap((resource) => {
    const change = valueChange(original[resource], current[resource], saved?.[resource]);
    return change ? [{ ...change, resource }] : [];
  });
}
