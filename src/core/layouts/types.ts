/** The shape of a save layout: where the editor finds each field in one family of saves. */

import type { COMMON_HERO_FIELDS } from './common';

/** Save layouts the editor knows. Several editions can share one layout. */
export type LayoutId =
  | 'restorationOfErathia'
  | 'hdEdition'
  | 'armageddonsBlade'
  | 'armageddonsBladeGog'
  | 'shadowOfDeath';

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
}

export interface SaveLayout {
  readonly id: LayoutId;
  readonly hero: HeroLayout;
}
