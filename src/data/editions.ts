/**
 * Game editions the editor understands and the limits each one puts on a save.
 * Limits match the 2.05 editor: newer editions only add ids at the end of the lists.
 */

export const EDITIONS = [
  'restorationOfErathia',
  'hdEdition',
  'armageddonsBlade',
  'shadowOfDeath',
  'heroesChronicles',
  'inTheWakeOfGods',
] as const;

export type Edition = (typeof EDITIONS)[number];

interface EditionRules {
  /** Content tier: editions with the same tier accept the same ids. */
  tier: number;
  /** Highest creature id that may appear in an army slot. */
  maxCreatureId: number;
  /** Highest artifact id that may appear in the backpack. */
  maxArtifactId: number;
}

export const EDITION_RULES: Record<Edition, EditionRules> = {
  restorationOfErathia: { tier: 0, maxCreatureId: 117, maxArtifactId: 126 },
  // Ubisoft's 2015 remaster has the Restoration of Erathia content only.
  hdEdition: { tier: 0, maxCreatureId: 117, maxArtifactId: 126 },
  armageddonsBlade: { tier: 1, maxCreatureId: 144, maxArtifactId: 128 },
  shadowOfDeath: { tier: 2, maxCreatureId: 144, maxArtifactId: 140 },
  heroesChronicles: { tier: 2, maxCreatureId: 144, maxArtifactId: 140 },
  inTheWakeOfGods: { tier: 3, maxCreatureId: 172, maxArtifactId: 143 },
};

/** True when something that appeared in `introducedIn` may be used in an `edition` save. */
export function isAvailableIn(introducedIn: Edition, edition: Edition): boolean {
  return EDITION_RULES[introducedIn].tier <= EDITION_RULES[edition].tier;
}
