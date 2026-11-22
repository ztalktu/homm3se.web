/** Where the artifacts taken off a hero go: into the backpack while it has room, or nowhere. */

import { artifactAllowed } from '../../core/rules';
import type { Edition } from '../../data/editions';

export interface TakenOff {
  toBackpack: number[];
  deleted: number[];
  /** Some of what should go into the backpack does not fit there and is deleted instead. */
  overflow: boolean;
}

/**
 * Splits what came off. With `keep` the artifacts go into the backpack, as many as fit in
 * `freePlaces` (no limit by default), in the order they came off; the rest is deleted.
 * Artifacts the backpack may not hold (a spell scroll would lose its spell there) are always
 * deleted.
 */
export function placeTakenOff(
  removed: readonly number[],
  keep: boolean,
  edition: Edition,
  freePlaces = Infinity,
): TakenOff {
  if (!keep) {
    return { toBackpack: [], deleted: [...removed], overflow: false };
  }
  const movable = removed.filter((artifactId) => artifactAllowed(artifactId, edition));
  const toBackpack = movable.slice(0, Math.max(0, freePlaces));
  const deleted = [...removed];
  for (const artifactId of toBackpack) {
    deleted.splice(deleted.indexOf(artifactId), 1);
  }
  return { toBackpack, deleted, overflow: movable.length > toBackpack.length };
}
