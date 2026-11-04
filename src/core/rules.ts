/**
 * What the editor allows a hero to look like, so the game does not choke on the save.
 * Problems are returned as codes; the interface turns them into messages.
 */

import { ARTIFACTS } from '../data/artifacts';
import { CREATURES } from '../data/creatures';
import { EDITION_RULES, isAvailableIn, type Edition } from '../data/editions';
import { HERO_CLASSES } from '../data/heroClasses';
import { MAX_LEVEL } from '../data/experience';
import { MAX_SECONDARY_SKILLS, SECONDARY_SKILL_COUNT } from '../data/skills';
import { SPELLS } from '../data/spells';
import type { Hero } from './hero';
import { HERO_LAYOUT, MAX_RESOURCE_AMOUNT } from './layout';

/** Field limits: the storage size, or the cap the 2.05 editor used for big numbers. */
export const HERO_LIMITS = {
  primarySkill: 255,
  level: MAX_LEVEL,
  experience: 2_147_483_647,
  mana: 65_535,
  movementPoints: 255,
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

/** Why a creature cannot go into an army slot of an `edition` save, or null if it can. */
export function creatureProblem(
  creatureId: number,
  edition: Edition,
): 'placeholder' | 'edition' | null {
  const creature = CREATURES[creatureId];
  if (!creature || creatureId > EDITION_RULES[edition].maxCreatureId) {
    return 'edition';
  }
  if (creature.kind === 'placeholder') {
    return 'placeholder';
  }
  return isAvailableIn(creature.introducedIn, edition) ? null : 'edition';
}

/**
 * The 2.05 editor refused the spell scroll outright (it needs a spell attached, which the
 * editor cannot set); the spell book and the catapult only come with a warning.
 */
export const BLOCKED_ARTIFACT_IDS: readonly number[] = [1];

export function artifactAllowed(artifactId: number, edition: Edition): boolean {
  const artifact = ARTIFACTS[artifactId];
  return (
    artifact !== undefined &&
    !BLOCKED_ARTIFACT_IDS.includes(artifactId) &&
    isAvailableIn(artifact.introducedIn, edition)
  );
}

function inRange(value: number, max: number, min = 0): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

export function validateHero(hero: Hero, edition: Edition): HeroProblem[] {
  const problems: HeroProblem[] = [];

  if (hero.name.trim() === '') {
    problems.push({ code: 'nameEmpty' });
  }
  const heroClass = HERO_CLASSES[hero.classId];
  if (!heroClass || !isAvailableIn(heroClass.introducedIn, edition)) {
    problems.push({ code: 'classNotInEdition', classId: hero.classId });
  }

  const numbers: [string, number, number, number?][] = [
    ['level', hero.level, HERO_LIMITS.level, 1],
    ['experience', hero.experience, HERO_LIMITS.experience],
    ['attack', hero.attack, HERO_LIMITS.primarySkill],
    ['defense', hero.defense, HERO_LIMITS.primarySkill],
    ['spellPower', hero.spellPower, HERO_LIMITS.primarySkill],
    ['knowledge', hero.knowledge, HERO_LIMITS.primarySkill],
    ['mana', hero.mana, HERO_LIMITS.mana],
    ['movementPoints', hero.movementPoints, HERO_LIMITS.movementPoints],
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
    if (creatureProblem(troop.creatureId, edition)) {
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
    if (!inRange(skillId, SECONDARY_SKILL_COUNT - 1)) {
      problems.push({ code: 'unknownSkill', skillId });
    } else if (seenSkills.has(skillId)) {
      problems.push({ code: 'duplicateSkill', skillId });
    }
    seenSkills.add(skillId);
  }

  if (hero.backpack.length > HERO_LAYOUT.backpackSlots) {
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
