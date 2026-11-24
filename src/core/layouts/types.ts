/** The shape of a save layout: where the editor finds each field in one family of saves. */

import type { COMMON_HERO_FIELDS } from './common';

/** Save layouts the editor knows. Several editions can share one layout. */
export type LayoutId =
  | 'restorationOfErathia'
  | 'hdEdition'
  | 'armageddonsBlade'
  | 'armageddonsBladeGog'
  | 'shadowOfDeath'
  | 'hornOfTheAbyss'
  | 'hornOfTheAbyssEarly';

type CommonHeroFields = { readonly [Field in keyof typeof COMMON_HERO_FIELDS]: number };

/** Hero record offsets, relative to the first byte of the hero name. */
export interface HeroLayout extends CommonHeroFields {
  /** First of the 64 backpack slots. */
  readonly backpack: number;
  /** Equipment slots from the helmet on, the spell book and "misc 5" included where present. */
  readonly equipmentSlots: number;
  /** First of the 10 counters of slots taken by combination artifacts, or null without them. */
  readonly combinationCounters: number | null;
  /** Record size from one hero to the next when the biography is empty; null if not measured. */
  readonly recordSize: number | null;
  /**
   * u16 X, u16 Y, u8 Z of the hero on the map, then two bytes on: 1 when the hero stands on the
   * map (a visitor in a town), 0 when in a town garrison or inactive.
   */
  readonly coordinates: number;
}

/**
 * Town record shape. Every layout keeps the fields up to the name at the same offsets
 * (COMMON_TOWN_FIELDS); the name itself and the record size differ.
 */
export interface TownLayout {
  /**
   * How the name is stored at COMMON_TOWN_FIELDS.name: `counted` is a u16 length and that many
   * bytes; a number is a field of that many bytes, the name NUL-terminated in it.
   */
  readonly name: 'counted' | number;
  /** Record size without the name text for a counted name, the whole record otherwise. */
  readonly recordSize: number;
  /**
   * The town fields of this layout were checked on few saves: the editor warns before
   * changing towns.
   */
  readonly fullyStudied: boolean;
}

export interface SaveLayout {
  readonly id: LayoutId;
  readonly hero: HeroLayout;
  readonly town: TownLayout;
}
