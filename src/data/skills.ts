// Generated from the Heroes III SaveEditor 2.05 sources. Maintained by hand from now on.
import { HORN_OF_THE_ABYSS_1_8_MINOR, type Edition } from './editions';

interface SecondarySkill {
  /** Index in the skill arrays of a hero. */
  id: number;
  /** The oldest edition whose saves may contain this skill. */
  introducedIn: Edition;
  /** Horn of the Abyss only: the first header minor version whose saves have the skill. */
  sinceMinor?: number;
}

/**
 * Secondary skills in save file order: 0–27 in every edition, then the two Horn of the Abyss
 * skills, 28 Interference and 29 Runes; older Horn of the Abyss saves have no room for Runes.
 */
export const SECONDARY_SKILLS: readonly SecondarySkill[] = [
  ...Array.from({ length: 28 }, (_, id) => ({ id, introducedIn: 'restorationOfErathia' as const })),
  { id: 28, introducedIn: 'hornOfTheAbyss' },
  { id: 29, introducedIn: 'hornOfTheAbyss', sinceMinor: HORN_OF_THE_ABYSS_1_8_MINOR },
];

/** Secondary skill levels: 1 basic, 2 advanced, 3 expert. */
export const SKILL_LEVELS = [1, 2, 3] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

/** A hero has at most eight secondary skills. */
export const MAX_SECONDARY_SKILLS = 8;
