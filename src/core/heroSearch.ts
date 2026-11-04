/**
 * Finding a hero by name, as the 2.05 editor did: look for the name bytes, then check that
 * the spell flags around the hit are all 0 or 1, which random text almost never is.
 */

import { HERO_LAYOUT, SEARCH_CHECKED_SPELLS } from './layout';
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
    const learned = buffer.readU8(position + HERO_LAYOUT.spellsLearned + spell);
    const available = buffer.readU8(position + HERO_LAYOUT.spellsAvailable + spell);
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

/** Continues a search after a previous hit. */
export function findNextHero(
  buffer: SaveBuffer,
  name: string,
  previous: HeroMatch,
): HeroMatch | null {
  // Skip past the previous name start (it may sit one byte after the record start).
  return findHero(buffer, name, previous.position + 2);
}
