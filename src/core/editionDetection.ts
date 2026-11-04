/**
 * Version auto-detection: if a hero has a class, creature or artifact that the selected
 * edition does not know, the save must be from a newer edition. Same rules as 2.05.
 */

import { ARTIFACTS } from '../data/artifacts';
import { CREATURES } from '../data/creatures';
import { EDITION_RULES, EDITIONS, isAvailableIn, type Edition } from '../data/editions';
import { HERO_CLASSES } from '../data/heroClasses';
import type { Hero } from './hero';

/** Everything in the hero that ties the save to a minimum edition. */
function introducedIns(hero: Hero): (Edition | undefined)[] {
  return [
    HERO_CLASSES[hero.classId]?.introducedIn,
    ...hero.troops.map((troop) => (troop ? CREATURES[troop.creatureId]?.introducedIn : undefined)),
  ];
}

/**
 * Returns the edition to switch to, or null when `current` already fits the hero.
 * The artifact check needs the backpack read with the right layout, so callers re-read
 * the hero after switching and call this again until it returns null.
 */
export function requiredEdition(hero: Hero, current: Edition): Edition | null {
  const tier = EDITION_RULES[current].tier;
  let needed = tier;
  for (const introducedIn of introducedIns(hero)) {
    if (introducedIn) {
      needed = Math.max(needed, EDITION_RULES[introducedIn].tier);
    }
  }
  for (const artifactId of hero.backpack) {
    const artifact = ARTIFACTS[artifactId];
    // Ids beyond every edition are junk read with a wrong layout; they do not prove anything.
    if (artifact && !isAvailableIn(artifact.introducedIn, current)) {
      needed = Math.max(needed, EDITION_RULES[artifact.introducedIn].tier);
    }
  }
  if (needed === tier) {
    return null;
  }
  return EDITIONS.find((edition) => EDITION_RULES[edition].tier === needed) ?? null;
}
