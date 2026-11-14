/**
 * Game editions the editor understands and the limits each one puts on a save.
 * Up to In the Wake of Gods a newer edition only adds ids at the end of the lists, as in the
 * 2.05 editor; Horn of the Abyss gives some of those ids to its own creatures and artifacts.
 *
 * The editions are not one line. Armageddon's Blade builds on Restoration of Erathia and
 * The Shadow of Death on Armageddon's Blade, but In the Wake of Gods and Horn of the Abyss are
 * two separate branches on top of The Shadow of Death: they give the same ids above the
 * Shadow of Death ones to different creatures and artifacts, so neither accepts the other's.
 */

import { MAX_LEVEL } from './experience';

export const EDITIONS = [
  'restorationOfErathia',
  'hdEdition',
  'armageddonsBlade',
  'shadowOfDeath',
  'heroesChronicles',
  'inTheWakeOfGods',
  'hornOfTheAbyss',
] as const;

export type Edition = (typeof EDITIONS)[number];

/**
 * Header minor version of Horn of the Abyss 1.8.0. From it on saves have the Factory and the
 * Bulwark, the Runes skill and the 1160-byte hero record; older ones (minor 5) have none of them.
 */
export const HORN_OF_THE_ABYSS_1_8_MINOR = 10;

interface EditionRules {
  /**
   * Editions whose content a save of this edition accepts, this one included. Editions with
   * the same content (HD Edition and Restoration of Erathia, for example) list each other.
   */
  includes: readonly Edition[];
  /** Highest hero level the game handles. */
  maxLevel: number;
  /**
   * Only the save header can tell this edition: the version auto-detection never switches to
   * it from the content of a hero.
   */
  headerOnly?: true;
}

const RESTORATION_OF_ERATHIA_CONTENT = ['restorationOfErathia', 'hdEdition'] as const;
const ARMAGEDDONS_BLADE_CONTENT = [...RESTORATION_OF_ERATHIA_CONTENT, 'armageddonsBlade'] as const;
const SHADOW_OF_DEATH_CONTENT = [
  ...ARMAGEDDONS_BLADE_CONTENT,
  'shadowOfDeath',
  'heroesChronicles',
] as const;

export const EDITION_RULES: Record<Edition, EditionRules> = {
  restorationOfErathia: { includes: RESTORATION_OF_ERATHIA_CONTENT, maxLevel: MAX_LEVEL },
  // Ubisoft's 2015 remaster has the Restoration of Erathia content only.
  hdEdition: { includes: RESTORATION_OF_ERATHIA_CONTENT, maxLevel: MAX_LEVEL },
  armageddonsBlade: { includes: ARMAGEDDONS_BLADE_CONTENT, maxLevel: MAX_LEVEL },
  shadowOfDeath: { includes: SHADOW_OF_DEATH_CONTENT, maxLevel: MAX_LEVEL },
  heroesChronicles: { includes: SHADOW_OF_DEATH_CONTENT, maxLevel: MAX_LEVEL },
  inTheWakeOfGods: {
    includes: [...SHADOW_OF_DEATH_CONTENT, 'inTheWakeOfGods'],
    maxLevel: MAX_LEVEL,
  },
  // Its own creature and artifact tables (see editionTable.ts) replace the ids above
  // The Shadow of Death ones; the header (major 44) is the only way to tell it.
  hornOfTheAbyss: {
    includes: [...SHADOW_OF_DEATH_CONTENT, 'hornOfTheAbyss'],
    maxLevel: 74,
    headerOnly: true,
  },
};

/** True when ids above The Shadow of Death ones mean Horn of the Abyss creatures and artifacts. */
export function usesHotaIds(edition: Edition): boolean {
  return edition === 'hornOfTheAbyss';
}

/** True when something that appeared in `introducedIn` may be used in an `edition` save. */
export function isAvailableIn(introducedIn: Edition, edition: Edition): boolean {
  return EDITION_RULES[edition].includes.includes(introducedIn);
}
