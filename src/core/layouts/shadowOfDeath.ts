/**
 * The Shadow of Death and Complete (header 42/2, map format 0x1C), also used by Heroes
 * Chronicles and In the Wake of Gods: a 19th equipment slot ("misc 5") moves the backpack
 * to +365, and counters of slots taken by combination artifacts follow it.
 */

import { COMMON_HERO_FIELDS } from './common';
import type { SaveLayout } from './types';

export const SHADOW_OF_DEATH_LAYOUT: SaveLayout = {
  id: 'shadowOfDeath',
  hero: {
    ...COMMON_HERO_FIELDS,
    backpack: 365,
    equipmentSlots: 19,
    combinationCounters: 877,
    recordSize: 1094,
  },
};
