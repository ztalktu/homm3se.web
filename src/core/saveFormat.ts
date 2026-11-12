/**
 * What the first bytes of an unpacked save say about the game that wrote it:
 * "H3SVG" (scenario) or "H3SVC" (campaign), then two u32 version numbers. Heroes Chronicles
 * writes "HCHRONSVG" instead, and everything after it is shifted by one byte.
 * Where the fields are in each kind of save is described in layouts/.
 */

import type { Edition } from '../data/editions';
import type { SaveBuffer } from './saveBuffer';

export type SaveFormat =
  | { kind: 'classic'; major: number; minor: number }
  | { kind: 'hornOfTheAbyss'; major: number; minor: number }
  | { kind: 'hdEdition'; major: number; minor: number }
  | { kind: 'heroesChronicles'; major: number; minor: number }
  | { kind: 'unknown' };

/** Same game and the same version in the header. */
export function isSameFormat(a: SaveFormat, b: SaveFormat): boolean {
  if (a.kind === 'unknown' || b.kind === 'unknown') {
    return a.kind === b.kind;
  }
  return a.kind === b.kind && a.major === b.major && a.minor === b.minor;
}

const SIGNATURES = ['H3SVG', 'H3SVC'];
const CHRONICLES_SIGNATURE = 'HCHRONSVG';
/** In a Heroes Chronicles header the version numbers come one byte later. */
const CHRONICLES_SHIFT = 1;
const HORN_OF_THE_ABYSS_MAJOR = 0x2c;
const HD_EDITION_MAJOR = 0x12;

export function detectSaveFormat(buffer: SaveBuffer): SaveFormat {
  const chronicles = String.fromCharCode(...buffer.bytes.subarray(0, CHRONICLES_SIGNATURE.length));
  if (chronicles === CHRONICLES_SIGNATURE) {
    const major = buffer.readU32(8 + CHRONICLES_SHIFT);
    const minor = buffer.readU32(12 + CHRONICLES_SHIFT);
    return major === undefined || minor === undefined
      ? { kind: 'unknown' }
      : { kind: 'heroesChronicles', major, minor };
  }
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
 * Every format with a layout of its own (see layouts/). Horn of the Abyss does not have one
 * yet and stays editable at the user's own risk.
 */
export function isEditingTested(format: SaveFormat): boolean {
  return format.kind !== 'hornOfTheAbyss' && format.kind !== 'unknown';
}

/** Armageddon's Blade writes header 42/1; every other 42.x or 43.x is The Shadow of Death. */
export function isArmageddonsBladeHeader(format: SaveFormat): boolean {
  return format.kind === 'classic' && format.major === 42 && format.minor === 1;
}

/**
 * Headers from this version on are written by The Shadow of Death and later games; below it
 * (16 and HD Edition's 18) by Restoration of Erathia. The layout choice is in layouts/index.ts.
 */
export const SHADOW_OF_DEATH_HEADER_MAJOR = 0x20;

/**
 * The edition that wrote this header when only one edition writes it: HD Edition,
 * Heroes Chronicles and Armageddon's Blade. Null for the others.
 */
export function editionFromHeader(format: SaveFormat): Edition | null {
  if (format.kind === 'hdEdition') {
    return 'hdEdition';
  }
  if (format.kind === 'heroesChronicles') {
    return 'heroesChronicles';
  }
  return isArmageddonsBladeHeader(format) ? 'armageddonsBlade' : null;
}

/**
 * The oldest edition that writes this header, or null when the header does not tell.
 * The Shadow of Death's header (major 0x20 and above) is also written by In the Wake of Gods,
 * so the edition can only be raised to it, never set outright.
 */
export function minimumEditionFor(format: SaveFormat): Edition | null {
  const exact = editionFromHeader(format);
  if (exact) {
    return exact;
  }
  if (format.kind === 'classic' && format.major >= SHADOW_OF_DEATH_HEADER_MAJOR) {
    return 'shadowOfDeath';
  }
  return null;
}
