/**
 * Horn of the Abyss keeps the classic creature and artifact ids up to a point and gives the ones
 * above it to its own (In the Wake of Gods saves use the same numbers for other ones). A table
 * answers what an id stands for in a save of a given edition.
 */
import { usesHotaIds, type Edition } from './editions';

export interface EditionTable<Entry extends { id: number }> {
  /** What an id stands for in an `edition` save, or undefined when there is none. */
  byId: (id: number, edition: Edition) => Entry | undefined;
  /**
   * Everything an `edition` save may know: the classic ids in id order, then the Horn of the
   * Abyss ones in the order of their table.
   */
  of: (edition: Edition) => readonly Entry[];
  /** True when the id means an entry of Horn of the Abyss's own table in an `edition` save. */
  isHota: (id: number, edition: Edition) => boolean;
}

/**
 * `classic` is indexed by id; `hota` holds the Horn of the Abyss entries, which replace classic
 * ones up to `keepsUpTo` and are the only ones above it.
 */
export function editionTable<Entry extends { id: number }>(
  classic: readonly Entry[],
  hota: ReadonlyMap<number, Entry>,
  keepsUpTo: number,
): EditionTable<Entry> {
  const hotaList = [
    ...classic.slice(0, keepsUpTo + 1).map((entry) => hota.get(entry.id) ?? entry),
    ...[...hota.values()].filter((entry) => entry.id > keepsUpTo),
  ];
  return {
    byId: (id, edition) =>
      usesHotaIds(edition)
        ? (hota.get(id) ?? (id <= keepsUpTo ? classic[id] : undefined))
        : classic[id],
    of: (edition) => (usesHotaIds(edition) ? hotaList : classic),
    isHota: (id, edition) => usesHotaIds(edition) && hota.has(id),
  };
}
