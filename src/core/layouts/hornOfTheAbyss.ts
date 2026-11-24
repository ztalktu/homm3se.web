/**
 * Horn of the Abyss (header major 44). The hero record keeps The Shadow of Death fields up to
 * the backpack and the combination artifact counters, but stores secondary skills its own way:
 * - the skill levels array grows to the new skills: 28 Interference, and from header minor 10
 *   on 29 Runes. It runs over +41 and +42, where the older games keep the skill slots;
 * - the skill slots move to +923, one byte per skill as before.
 *
 * Header minor 10 (1.8.0) and 11 (1.8.1) write 30 skills and a 1160-byte record. Older saves
 * (minor 5, before the Factory town) write 29 skills and a 1147-byte record; the byte after
 * their 29 skill slots already belongs to another field, so it must not be written.
 */

import { HORN_OF_THE_ABYSS_1_8_MINOR } from '../../data/editions';
import { SHADOW_OF_DEATH_LAYOUT } from './shadowOfDeath';
import type { SaveLayout } from './types';

const SKILL_SLOTS = 923;

export const HORN_OF_THE_ABYSS_LAYOUT: SaveLayout = {
  id: 'hornOfTheAbyss',
  hero: {
    ...SHADOW_OF_DEATH_LAYOUT.hero,
    secondarySkillSlots: SKILL_SLOTS,
    secondarySkillIds: 30,
    recordSize: 1160,
  },
  town: { name: 'counted', recordSize: 567, fullyStudied: true },
};

export const HORN_OF_THE_ABYSS_EARLY_LAYOUT: SaveLayout = {
  id: 'hornOfTheAbyssEarly',
  hero: {
    ...SHADOW_OF_DEATH_LAYOUT.hero,
    secondarySkillSlots: SKILL_SLOTS,
    secondarySkillIds: 29,
    recordSize: 1147,
  },
  town: { name: 'counted', recordSize: 546, fullyStudied: true },
};

/** The Horn of the Abyss layout for a header minor version. */
export function hornOfTheAbyssLayout(minor: number): SaveLayout {
  return minor >= HORN_OF_THE_ABYSS_1_8_MINOR
    ? HORN_OF_THE_ABYSS_LAYOUT
    : HORN_OF_THE_ABYSS_EARLY_LAYOUT;
}
