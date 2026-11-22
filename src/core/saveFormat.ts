/**
 * What the first bytes of an unpacked save say about the game that wrote it:
 * "H3SVG" (scenario) or "H3SVC" (campaign), then two u32 version numbers. Heroes Chronicles
 * writes "HCHRONSVG" instead, and everything after it is shifted by one byte.
 * Where the fields are in each kind of save is described in layouts/.
 */

import { EDITIONS, type Edition } from '../data/editions';
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
/**
 * Horn of the Abyss header minors the layouts were checked on: 5 (before 1.7), 10 (1.8.0) and
 * 11 (1.8.1). Saves of other versions open with the nearest layout, at the user's own risk.
 */
const TESTED_HORN_OF_THE_ABYSS_MINORS: readonly number[] = [5, 10, 11];

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
 * Every format with a layout of its own (see layouts/), for Horn of the Abyss only the versions
 * it was checked on. Other saves stay editable at the user's own risk.
 */
export function isEditingTested(format: SaveFormat): boolean {
  if (format.kind === 'hornOfTheAbyss') {
    return TESTED_HORN_OF_THE_ABYSS_MINORS.includes(format.minor);
  }
  return format.kind !== 'unknown';
}

/**
 * In header 42 the minor names the edition of the game's content: 0 Restoration of Erathia,
 * 1 Armageddon's Blade, 2 The Shadow of Death. Complete writes all three, for example for the
 * campaigns of each edition, with The Shadow of Death's hero records.
 */
const CONTENT_HEADER_MAJOR = 42;
const RESTORATION_OF_ERATHIA_MINOR = 0;
const ARMAGEDDONS_BLADE_MINOR = 1;

/** Armageddon's Blade content writes header 42/1. */
export function isArmageddonsBladeHeader(format: SaveFormat): boolean {
  return (
    format.kind === 'classic' &&
    format.major === CONTENT_HEADER_MAJOR &&
    format.minor === ARMAGEDDONS_BLADE_MINOR
  );
}

/** Restoration of Erathia content in a newer game writes header 42/0. */
function isRestorationOfErathiaContentHeader(format: SaveFormat): boolean {
  return (
    format.kind === 'classic' &&
    format.major === CONTENT_HEADER_MAJOR &&
    format.minor === RESTORATION_OF_ERATHIA_MINOR
  );
}

/**
 * Headers from this version on are written by The Shadow of Death and later games; below it
 * (16 and HD Edition's 18) by Restoration of Erathia. The layout choice is in layouts/index.ts.
 */
export const SHADOW_OF_DEATH_HEADER_MAJOR = 0x20;

/**
 * The editions whose content this header allows, in the order of EDITIONS. Most headers name
 * one edition only: HD Edition, Heroes Chronicles, Horn of the Abyss, Armageddon's Blade
 * (42/1) and Restoration of Erathia (below 0x20, and 42/0). The Shadow of Death's header
 * (other ones from 0x20 on) is also written by In the Wake of Gods. An unknown header rules
 * nothing out.
 */
export function editionsForHeader(format: SaveFormat): readonly Edition[] {
  switch (format.kind) {
    case 'hdEdition':
      return ['hdEdition'];
    case 'heroesChronicles':
      return ['heroesChronicles'];
    case 'hornOfTheAbyss':
      return ['hornOfTheAbyss'];
    case 'unknown':
      return EDITIONS;
    case 'classic':
      if (isArmageddonsBladeHeader(format)) {
        return ['armageddonsBlade'];
      }
      if (isRestorationOfErathiaContentHeader(format)) {
        return ['restorationOfErathia'];
      }
      return format.major < SHADOW_OF_DEATH_HEADER_MAJOR
        ? ['restorationOfErathia']
        : ['shadowOfDeath', 'inTheWakeOfGods'];
  }
}
