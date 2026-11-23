/**
 * Restoration of Erathia (header major 16–41, map format 0x0E): 18 equipment slots without
 * "misc 5", so the backpack starts eight bytes earlier than in The Shadow of Death.
 */

import { COMMON_HERO_FIELDS } from './common';
import type { SaveLayout } from './types';

export const RESTORATION_OF_ERATHIA_LAYOUT: SaveLayout = {
  id: 'restorationOfErathia',
  hero: {
    ...COMMON_HERO_FIELDS,
    backpack: 357,
    equipmentSlots: 18,
    combinationCounters: null,
    recordSize: 1065,
    coordinates: -189,
  },
  // Header 42/0 (Restoration of Erathia content written by Complete) is The Shadow of Death's.
  town: { name: 13, recordSize: 393, fullyStudied: false },
};
