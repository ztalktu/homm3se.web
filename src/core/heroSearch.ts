/**
 * Finding a hero by name, as the 2.05 editor did: look for the name bytes, then check that
 * the spell flags around the hit are all 0 or 1, which random text almost never is.
 */

import { readHeroOwner, type HeroOwner } from './hero';
import { COMMON_HERO_FIELDS, SEARCH_CHECKED_SPELLS } from './layouts';
import type { SaveBuffer } from './saveBuffer';
import { codePagesFor, encodeText, type CodePage } from './textEncoding';

const SPACE = 0x20;

export interface HeroMatch {
  /** Position of the hero record: the first byte of the name field. */
  position: number;
  /** Code page the name was found in; the hero is read and written with it. */
  codePage: CodePage;
}

function looksLikeHero(buffer: SaveBuffer, position: number): boolean {
  for (let spell = 0; spell < SEARCH_CHECKED_SPELLS; spell += 1) {
    const learned = buffer.readU8(position + COMMON_HERO_FIELDS.spellsLearned + spell);
    const available = buffer.readU8(position + COMMON_HERO_FIELDS.spellsAvailable + spell);
    if (learned === undefined || available === undefined || learned > 1 || available > 1) {
      return false;
    }
  }
  return true;
}

/**
 * Some translations store names with a leading space ("crooked" translations in the old help):
 * then the record starts at the space, one byte before the name text.
 */
function recordStart(buffer: SaveBuffer, nameStart: number): number {
  return buffer.readU8(nameStart - 1) === SPACE ? nameStart - 1 : nameStart;
}

function findWithBytes(buffer: SaveBuffer, nameBytes: Uint8Array, from: number): number | null {
  let offset = buffer.indexOf(nameBytes, from);
  while (offset !== null) {
    // The name must end right there: "Adela" must not match the record of "Adelaide".
    const terminated = buffer.readU8(offset + nameBytes.length) === 0;
    if (terminated && looksLikeHero(buffer, offset)) {
      return offset;
    }
    offset = buffer.indexOf(nameBytes, offset + 1);
  }
  return null;
}

/**
 * Finds the next hero called `name` whose name starts at or after `from`.
 * Tries each code page the name can be written in and returns the nearest hit.
 */
export function findHero(buffer: SaveBuffer, name: string, from = 0): HeroMatch | null {
  let best: { nameStart: number; codePage: CodePage } | null = null;
  for (const codePage of codePagesFor(name)) {
    const bytes = encodeText(name, codePage);
    if (!bytes || bytes.length === 0) {
      continue;
    }
    const nameStart = findWithBytes(buffer, bytes, from);
    if (nameStart !== null && (best === null || nameStart < best.nameStart)) {
      best = { nameStart, codePage };
    }
  }
  return best && { position: recordStart(buffer, best.nameStart), codePage: best.codePage };
}

/**
 * Which of `names` the save holds a hero record for, with the owners of those records,
 * in one pass over the file. Same rules as `findHero` (whole name, zero byte after it, spell
 * flags of a hero), but calling `findHero` for every name scans the file hundreds of times
 * and takes seconds.
 *
 * Every name is encoded with its terminating zero, so each pattern is at least two bytes long;
 * the first two bytes pick the candidates. Saves are mostly zeros, so few positions get past
 * the table check.
 */
export function findHeroNames(
  buffer: SaveBuffer,
  names: Iterable<string>,
): Map<string, HeroOwner[]> {
  const byPrefix = new Map<number, { name: string; pattern: Uint8Array }[]>();
  for (const name of names) {
    for (const codePage of codePagesFor(name)) {
      const bytes = encodeText(name, codePage);
      if (!bytes || bytes.length === 0) {
        continue;
      }
      const pattern = new Uint8Array(bytes.length + 1);
      pattern.set(bytes);
      const prefix = (pattern[0] ?? 0) | ((pattern[1] ?? 0) << 8);
      const candidates = byPrefix.get(prefix);
      if (candidates) {
        candidates.push({ name, pattern });
      } else {
        byPrefix.set(prefix, [{ name, pattern }]);
      }
    }
  }
  const hasPrefix = new Uint8Array(0x10000);
  for (const prefix of byPrefix.keys()) {
    hasPrefix[prefix] = 1;
  }

  const found = new Map<string, HeroOwner[]>();
  const bytes = buffer.bytes;
  for (let offset = 0; offset + 1 < bytes.length; offset += 1) {
    const prefix = (bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8);
    const candidates = hasPrefix[prefix] ? byPrefix.get(prefix) : undefined;
    if (!candidates) {
      continue;
    }
    for (const { name, pattern } of candidates) {
      if (offset + pattern.length > bytes.length) {
        continue;
      }
      let matches = true;
      for (let index = 2; index < pattern.length; index += 1) {
        if (bytes[offset + index] !== pattern[index]) {
          matches = false;
          break;
        }
      }
      if (!matches) {
        continue;
      }
      // The owner byte is cheap; the hero check is not, so it runs only for a new owner.
      const owner = readHeroOwner(buffer, recordStart(buffer, offset));
      const owners = found.get(name);
      if (owners?.includes(owner) || !looksLikeHero(buffer, offset)) {
        continue;
      }
      if (owners) {
        owners.push(owner);
      } else {
        found.set(name, [owner]);
      }
    }
  }
  return found;
}

/** Continues a search after a previous hit. */
export function findNextHero(
  buffer: SaveBuffer,
  name: string,
  previous: HeroMatch,
): HeroMatch | null {
  // Skip past the previous name start (it may sit one byte after the record start).
  return findHero(buffer, name, previous.position + 2);
}
