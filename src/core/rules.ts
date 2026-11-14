/**
 * What the editor allows a hero to look like, so the game does not choke on the save.
 * Problems are returned as codes; the interface turns them into messages.
 */

import { artifactById } from '../data/artifacts';
import { creatureById, townSinceMinor, type Town } from '../data/creatures';
import { EDITION_RULES, isAvailableIn, type Edition } from '../data/editions';
import { HERO_CLASSES } from '../data/heroClasses';
import { MAX_SECONDARY_SKILLS, SECONDARY_SKILLS } from '../data/skills';
import { SPELLS } from '../data/spells';
import type { Hero } from './hero';
import { COMMON_HERO_FIELDS, MAX_RESOURCE_AMOUNT } from './layouts';

/** Field limits: the storage size, or the cap the 2.05 editor used for big numbers. */
export const HERO_LIMITS = {
  primarySkill: 255,
  experience: 2_147_483_647,
  mana: 65_535,
  // Real values are about 1500–3000; the field is a u32, the cap keeps typos out.
  movementPoints: 99_999,
  // The same cap as the resource fields: what the 2.05 editor allowed in a count.
  troopCount: MAX_RESOURCE_AMOUNT,
} as const;

export type HeroProblem =
  | { code: 'nameEmpty' }
  | { code: 'classNotInEdition'; classId: number }
  | { code: 'noTroops' }
  | { code: 'troopCountZero'; slot: number }
  | { code: 'creatureNotAllowed'; slot: number; creatureId: number }
  | { code: 'duplicateSkill'; skillId: number }
  | { code: 'tooManySkills' }
  | { code: 'unknownSkill'; skillId: number }
  | { code: 'backpackFull' }
  | { code: 'artifactNotAllowed'; artifactId: number }
  | { code: 'spellNotInEdition'; spellId: number }
  | { code: 'valueOutOfRange'; field: string };

/**
 * What limits a save besides its edition, known only from the opened file: the header minor
 * version of a Horn of the Abyss save. Older ones (before 1.8.0) have neither the Factory nor
 * the Bulwark, nor the Runes skill. Omitted, everything of the edition is allowed.
 */
export interface SaveLimits {
  minor?: number | undefined;
}

/** False for Horn of the Abyss content that came after the save's header minor version. */
function inSave(sinceMinor: number | undefined, limits: SaveLimits): boolean {
  return sinceMinor === undefined || limits.minor === undefined || limits.minor >= sinceMinor;
}

/** The same for a town and what belongs to it. */
function townInSave(town: Town | undefined, limits: SaveLimits): boolean {
  return inSave(townSinceMinor(town), limits);
}

/** Why a creature cannot go into an army slot of an `edition` save, or null if it can. */
export function creatureProblem(
  creatureId: number,
  edition: Edition,
  limits: SaveLimits = {},
): 'placeholder' | 'edition' | null {
  const creature = creatureById(creatureId, edition);
  if (!creature) {
    return 'edition';
  }
  if (creature.kind === 'placeholder') {
    return 'placeholder';
  }
  // The Halfling keeps its Armageddon's Blade id: a neutral in saves without the Factory.
  const present = creature.introducedIn !== 'hornOfTheAbyss' || townInSave(creature.town, limits);
  return isAvailableIn(creature.introducedIn, edition) && present ? null : 'edition';
}

/** Whether a hero of an `edition` save may have this class. */
export function classAllowed(classId: number, edition: Edition, limits: SaveLimits = {}): boolean {
  const heroClass = HERO_CLASSES[classId];
  return (
    heroClass !== undefined &&
    isAvailableIn(heroClass.introducedIn, edition) &&
    townInSave(heroClass.town, limits)
  );
}

/**
 * The 2.05 editor refused the spell scroll outright (it needs a spell attached, which the
 * editor cannot set); the spell book and the catapult only come with a warning.
 */
export const BLOCKED_ARTIFACT_IDS: readonly number[] = [1];

export function artifactAllowed(artifactId: number, edition: Edition): boolean {
  const artifact = artifactById(artifactId, edition);
  return (
    artifact !== undefined &&
    !BLOCKED_ARTIFACT_IDS.includes(artifactId) &&
    isAvailableIn(artifact.introducedIn, edition)
  );
}

/** Whether a hero of an `edition` save may have this secondary skill. */
export function skillAllowed(skillId: number, edition: Edition, limits: SaveLimits = {}): boolean {
  const skill = SECONDARY_SKILLS[skillId];
  return (
    skill !== undefined &&
    isAvailableIn(skill.introducedIn, edition) &&
    inSave(skill.sinceMinor, limits)
  );
}

/** Highest hero level of an `edition` save. */
export function maxLevel(edition: Edition): number {
  return EDITION_RULES[edition].maxLevel;
}

function inRange(value: number, max: number, min = 0): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function validateHero(hero: Hero, edition: Edition, limits: SaveLimits = {}): HeroProblem[] {
  const problems: HeroProblem[] = [];

  if (hero.name.trim() === '') {
    problems.push({ code: 'nameEmpty' });
  }
  if (!classAllowed(hero.classId, edition, limits)) {
    problems.push({ code: 'classNotInEdition', classId: hero.classId });
  }

  const numbers: [string, number, number, number?][] = [
    ['level', hero.level, maxLevel(edition), 1],
    ['experience', hero.experience, HERO_LIMITS.experience],
    ['attack', hero.attack, HERO_LIMITS.primarySkill],
    ['defense', hero.defense, HERO_LIMITS.primarySkill],
    ['spellPower', hero.spellPower, HERO_LIMITS.primarySkill],
    ['knowledge', hero.knowledge, HERO_LIMITS.primarySkill],
    ['mana', hero.mana, HERO_LIMITS.mana],
    ['movementPoints', hero.movementPoints, HERO_LIMITS.movementPoints],
    ['maxMovementPoints', hero.maxMovementPoints, HERO_LIMITS.movementPoints],
  ];
  for (const [field, value, max, min] of numbers) {
    if (!inRange(value, max, min)) {
      problems.push({ code: 'valueOutOfRange', field });
    }
  }

  // The game needs at least one creature in the army ("a captain without an army!").
  if (hero.troops.every((troop) => troop === null)) {
    problems.push({ code: 'noTroops' });
  }
  hero.troops.forEach((troop, slot) => {
    if (!troop) {
      return;
    }
    if (creatureProblem(troop.creatureId, edition, limits)) {
      problems.push({ code: 'creatureNotAllowed', slot, creatureId: troop.creatureId });
    }
    if (troop.count < 1) {
      problems.push({ code: 'troopCountZero', slot });
    } else if (!inRange(troop.count, HERO_LIMITS.troopCount)) {
      problems.push({ code: 'valueOutOfRange', field: `troop${slot}` });
    }
  });

  if (hero.secondarySkills.length > MAX_SECONDARY_SKILLS) {
    problems.push({ code: 'tooManySkills' });
  }
  const seenSkills = new Set<number>();
  for (const { skillId } of hero.secondarySkills) {
    if (!skillAllowed(skillId, edition, limits)) {
      problems.push({ code: 'unknownSkill', skillId });
    } else if (seenSkills.has(skillId)) {
      problems.push({ code: 'duplicateSkill', skillId });
    }
    seenSkills.add(skillId);
  }

  if (hero.backpack.length > COMMON_HERO_FIELDS.backpackSlots) {
    problems.push({ code: 'backpackFull' });
  }
  for (const artifactId of hero.backpack) {
    if (!artifactAllowed(artifactId, edition)) {
      problems.push({ code: 'artifactNotAllowed', artifactId });
    }
  }

  for (const spellId of hero.spells) {
    const spell = SPELLS[spellId];
    if (!spell || !isAvailableIn(spell.introducedIn, edition)) {
      problems.push({ code: 'spellNotInEdition', spellId });
    }
  }

  return problems;
}
