/**
 * What the first bytes of an unpacked save say about the game that wrote it:
 * "H3SVG" (scenario) or "H3SVC" (campaign), then two u32 version numbers.
 * The editor's offsets come from the 2001–2005 editions; newer games use other layouts.
 */

import type { Edition } from '../data/editions';
import { BACKPACK_OFFSET } from './layout';
import type { SaveBuffer } from './saveBuffer';

export type SaveFormat =
  | { kind: 'classic'; major: number; minor: number }
  | { kind: 'hornOfTheAbyss'; major: number; minor: number }
  | { kind: 'hdEdition'; major: number; minor: number }
  | { kind: 'unknown' };

const SIGNATURES = ['H3SVG', 'H3SVC'];
const HORN_OF_THE_ABYSS_MAJOR = 0x2c;
const HD_EDITION_MAJOR = 0x12;

export function detectSaveFormat(buffer: SaveBuffer): SaveFormat {
  const signature = String.fromCharCode(...buffer.bytes.subarray(0, 5));
  const major = buffer.readU32(8);
  const minor = buffer.readU32(12);
  if (!SIGNATURES.includes(signature) || major === undefined || minor === undefined) {
    return { kind: 'unknown' };
  }
  if (major === HORN_OF_THE_ABYSS_MAJOR) {
    return { kind: 'hornOfTheAbyss', major, minor };
  }
  if (major === HD_EDITION_MAJOR) {
    return { kind: 'hdEdition', major, minor };
  }
  return { kind: 'classic', major, minor };
}

/**
 * Editing is tested on the classic formats and on HD Edition saves, whose hero records match
 * the classic layout byte for byte. Other formats stay editable at the user's own risk.
 */
export function isEditingTested(format: SaveFormat): boolean {
  return format.kind === 'classic' || format.kind === 'hdEdition';
}

/** Saves with a header version below this keep the backpack at the older offset. */
const OLD_BACKPACK_BELOW_MAJOR = 0x20;

/**
 * Where the backpack starts in a hero record. The header version decides when it is known
 * (version 16 and HD Edition's 18 use the older place, The Shadow of Death's 42 the newer);
 * otherwise the selected edition does, as in 2.05.
 */
export function backpackOffsetFor(format: SaveFormat, edition: Edition): number {
  if (format.kind === 'unknown') {
    return BACKPACK_OFFSET[edition];
  }
  return format.major < OLD_BACKPACK_BELOW_MAJOR
    ? BACKPACK_OFFSET.restorationOfErathia
    : BACKPACK_OFFSET.shadowOfDeath;
}

/**
 * The oldest edition that writes this header, or null when the header does not tell.
 * Only The Shadow of Death's header (major 0x20 and above) is known for sure. HD Edition
 * is Restoration of Erathia only, and its saves store a Restoration of Erathia map.
 */
export function minimumEditionFor(format: SaveFormat): Edition | null {
  if (format.kind === 'classic' && format.major >= OLD_BACKPACK_BELOW_MAJOR) {
    return 'shadowOfDeath';
  }
  return null;
}
