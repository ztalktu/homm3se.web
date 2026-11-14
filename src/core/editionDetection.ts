/**
 * Version auto-detection: if a hero has a class, creature or artifact that the selected
 * edition does not know, the save must be from an edition that adds it (as in the 2.05 editor).
 * Editions are branches, not one line: the switch goes to one that keeps what the current one
 * accepts, and never to Horn of the Abyss, which only its header tells.
 */

import { artifactById } from '../data/artifacts';
import { creatureById } from '../data/creatures';
import { EDITION_RULES, EDITIONS, isAvailableIn, type Edition } from '../data/editions';
import { HERO_CLASSES } from '../data/heroClasses';
import type { Hero } from './hero';

/** Everything in the hero that ties the save to a minimum edition. */
function introducedIns(hero: Hero, current: Edition): (Edition | undefined)[] {
  return [
    HERO_CLASSES[hero.classId]?.introducedIn,
    ...hero.troops.map((troop) =>
      troop ? creatureById(troop.creatureId, current)?.introducedIn : undefined,
    ),
  ];
}

/**
 * Returns the edition to switch to, or null when `current` already fits the hero.
 * The artifact check needs the backpack read with the right layout, so callers re-read
 * the hero after switching and call this again until it returns null.
 */
export function requiredEdition(hero: Hero, current: Edition): Edition | null {
  const needed = new Set<Edition>();
  for (const introducedIn of introducedIns(hero, current)) {
    if (introducedIn) {
      needed.add(introducedIn);
    }
  }
  for (const artifactId of hero.backpack) {
    const artifact = artifactById(artifactId, current);
    // Ids beyond every edition are junk read with a wrong layout; they do not prove anything.
    if (artifact && !isAvailableIn(artifact.introducedIn, current)) {
      needed.add(artifact.introducedIn);
    }
  }
  const fits = (edition: Edition): boolean =>
    [...needed].every((introducedIn) => isAvailableIn(introducedIn, edition));
  if (fits(current)) {
    return null;
  }
  // The first edition that keeps everything the current one accepts and adds what is missing.
  return (
    EDITIONS.find(
      (edition) =>
        !EDITION_RULES[edition].headerOnly && isAvailableIn(current, edition) && fits(edition),
    ) ?? null
  );
}
