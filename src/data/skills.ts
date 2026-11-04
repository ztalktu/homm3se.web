// Generated from the Heroes III SaveEditor 2.05 sources. Maintained by hand from now on.

/** Secondary skill ids as stored in the save file, 0–27. */
export const SECONDARY_SKILL_COUNT = 28;

/** Secondary skill levels: 1 basic, 2 advanced, 3 expert. */
export const SKILL_LEVELS = [1, 2, 3] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

/** A hero has at most eight secondary skills. */
export const MAX_SECONDARY_SKILLS = 8;
