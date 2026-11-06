/**
 * What the first bytes of an unpacked save say about the game that wrote it:
 * "H3SVG" (scenario) or "H3SVC" (campaign), then two u32 version numbers.
 * Where the fields are in each kind of save is described in layouts/.
 */

import type { Edition } from '../data/editions';
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
 * Editing is tested on the classic formats and on HD Edition saves (see layouts/). Other
 * formats stay editable at the user's own risk.
 */
export function isEditingTested(format: SaveFormat): boolean {
  return format.kind === 'classic' || format.kind === 'hdEdition';
}

/**
 * Headers from this version on are written by The Shadow of Death and later games; below it
 * (16 and HD Edition's 18) by Restoration of Erathia. The layout choice is in layouts/index.ts.
 */
export const SHADOW_OF_DEATH_HEADER_MAJOR = 0x20;

/**
 * The oldest edition that writes this header, or null when the header does not tell.
 * Only The Shadow of Death's header (major 0x20 and above) is known for sure. HD Edition
 * is Restoration of Erathia only, and its saves store a Restoration of Erathia map.
 */
export function minimumEditionFor(format: SaveFormat): Edition | null {
  if (format.kind === 'classic' && format.major >= SHADOW_OF_DEATH_HEADER_MAJOR) {
    return 'shadowOfDeath';
  }
  return null;
}
