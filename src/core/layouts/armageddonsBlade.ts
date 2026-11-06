/**
 * Armageddon's Blade (header 42/1): new content, but 18 equipment slots like Restoration of
 * Erathia. It comes in two variants that the header does not tell apart (FORMAT.md §4.3):
 * the original one keeps the backpack at +357, the newer one (GOG) has 8 more bytes after
 * the equipment and the backpack at +365. `armageddonsBladeLayoutAt` picks one by looking at
 * a hero record. There are no such saves to measure the record size on.
 */

import { EMPTY_SLOT, type SaveBuffer } from '../saveBuffer';
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

/**
 * The Armageddon's Blade variant of the hero whose name starts at `position`: the newer one
 * only when its backpack looks real and the original one's does not, the original otherwise.
 */
export function armageddonsBladeLayoutAt(buffer: SaveBuffer, position: number): SaveLayout {
  const original = ARMAGEDDONS_BLADE_LAYOUT;
  const gog = ARMAGEDDONS_BLADE_GOG_LAYOUT;
  const originalReal = backpackLooksReal(buffer, position + original.hero.backpack, original);
  const gogReal = backpackLooksReal(buffer, position + gog.hero.backpack, gog);
  return gogReal && !originalReal ? gog : original;
}
