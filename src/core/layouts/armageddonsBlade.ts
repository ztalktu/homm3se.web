/**
 * Armageddon's Blade (header 42/1): new content, but 18 equipment slots like Restoration of
 * Erathia. It comes in two variants that the header does not tell apart:
 * the original one keeps the backpack at +357, the newer one has 8 more bytes after
 * the equipment and the backpack at +365. The newer one is what Complete writes for an
 * Armageddon's Blade campaign: its hero records are The Shadow of Death ones, 1094 bytes with
 * a 19th equipment slot in those 8 bytes. `armageddonsBladeLayoutAt` picks one by looking at
 * a hero record.
 */

import { EMPTY_SLOT, type SaveBuffer } from '../saveBuffer';
import { COMMON_HERO_FIELDS, SEARCH_CHECKED_SPELLS } from './common';
import { RESTORATION_OF_ERATHIA_LAYOUT } from './restorationOfErathia';
import type { SaveLayout } from './types';

export const ARMAGEDDONS_BLADE_LAYOUT: SaveLayout = {
  id: 'armageddonsBlade',
  hero: { ...RESTORATION_OF_ERATHIA_LAYOUT.hero, recordSize: null },
};

export const ARMAGEDDONS_BLADE_GOG_LAYOUT: SaveLayout = {
  id: 'armageddonsBladeGog',
  hero: { ...ARMAGEDDONS_BLADE_LAYOUT.hero, backpack: 365 },
};

/** Highest artifact id in Armageddon's Blade. */
const MAX_ARTIFACT_ID = 128;
const SPELL_SCROLL = 1;
const MAX_SPELL_ID = 69;

/**
 * True when a backpack slot holds what the game writes there: nothing (the extra value
 * FFFFFFFF or 0), or an artifact other than the spell book with the same kind of extra
 * value, or a spell scroll with its spell.
 */
function slotLooksReal(artifactId: number, extra: number): boolean {
  const plainExtra = extra === EMPTY_SLOT || extra === 0;
  if (artifactId === EMPTY_SLOT) {
    return plainExtra;
  }
  if (artifactId === SPELL_SCROLL) {
    return extra <= MAX_SPELL_ID;
  }
  return artifactId > 0 && artifactId <= MAX_ARTIFACT_ID && plainExtra;
}

function backpackLooksReal(buffer: SaveBuffer, start: number, layout: SaveLayout): boolean {
  const { backpackSlots, backpackSlotSize } = layout.hero;
  for (let slot = 0; slot < backpackSlots; slot += 1) {
    const artifactId = buffer.readU32(start + slot * backpackSlotSize);
    const extra = buffer.readU32(start + slot * backpackSlotSize + 4);
    if (artifactId === undefined || extra === undefined || !slotLooksReal(artifactId, extra)) {
      return false;
    }
  }
  return true;
}

const FIRST_NAME_BYTE = 0x20;
/** Hero record sizes of the two variants: Restoration of Erathia's and The Shadow of Death's. */
const ORIGINAL_RECORD_SIZE = 1065;
const NEWER_RECORD_SIZE = 1094;

/** True when a hero record starts at `start`: a NUL-terminated name and 0/1 spell flags. */
function recordAt(buffer: SaveBuffer, start: number): boolean {
  const first = buffer.readU8(start);
  if (first === undefined || first < FIRST_NAME_BYTE) {
    return false;
  }
  let terminated = false;
  for (let index = 1; index < COMMON_HERO_FIELDS.nameLength && !terminated; index += 1) {
    const byte = buffer.readU8(start + index);
    if (byte === undefined || (byte !== 0 && byte < FIRST_NAME_BYTE)) {
      return false;
    }
    terminated = byte === 0;
  }
  if (!terminated) {
    return false;
  }
  for (let spell = 0; spell < SEARCH_CHECKED_SPELLS; spell += 1) {
    const learned = buffer.readU8(start + COMMON_HERO_FIELDS.spellsLearned + spell);
    const available = buffer.readU8(start + COMMON_HERO_FIELDS.spellsAvailable + spell);
    if (learned === undefined || available === undefined || learned > 1 || available > 1) {
      return false;
    }
  }
  return true;
}

/** True when the hero records around `position` are `size` bytes apart. */
function recordsSpaced(buffer: SaveBuffer, position: number, size: number): boolean {
  return recordAt(buffer, position - size) || recordAt(buffer, position + size);
}

/**
 * The Armageddon's Blade variant of the hero whose name starts at `position`. The heroes lie
 * one after another, so the distance to a neighbouring record tells the variant. With no
 * neighbour found, the newer one only when its backpack looks real and the original one's does
 * not: in a record of the newer variant the 8 extra bytes can be an empty slot, and then the
 * original backpack looks real too.
 */
export function armageddonsBladeLayoutAt(buffer: SaveBuffer, position: number): SaveLayout {
  const original = ARMAGEDDONS_BLADE_LAYOUT;
  const gog = ARMAGEDDONS_BLADE_GOG_LAYOUT;
  if (recordsSpaced(buffer, position, NEWER_RECORD_SIZE)) {
    return gog;
  }
  if (recordsSpaced(buffer, position, ORIGINAL_RECORD_SIZE)) {
    return original;
  }
  const originalReal = backpackLooksReal(buffer, position + original.hero.backpack, original);
  const gogReal = backpackLooksReal(buffer, position + gog.hero.backpack, gog);
  return gogReal && !originalReal ? gog : original;
}
