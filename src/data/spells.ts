// Generated from the Heroes III SaveEditor 2.05 sources. Maintained by hand from now on.
// Schools and levels follow the game (heroes.thelazy.net, mightandmagic.fandom.com).
import type { Edition } from './editions';

/** Magic school; Magic Arrow and Visions belong to all four. */
export type SpellSchool = 'air' | 'fire' | 'water' | 'earth' | 'all';
export const SPELL_SCHOOLS = ['air', 'fire', 'water', 'earth'] as const;
/** One of the four schools, as a column of the spell list. */
export type MagicSchool = (typeof SPELL_SCHOOLS)[number];

export const SPELL_LEVELS = [1, 2, 3, 4, 5] as const;
export type SpellLevel = (typeof SPELL_LEVELS)[number];

/** What a spell is for; the editor groups and filters spells by it. */
export const SPELL_PURPOSES = [
  'damage',
  'buff',
  'protection',
  'weakening',
  'control',
  'healing',
  'battlefield',
  'special',
  'summoning',
  'adventure',
] as const;
export type SpellPurpose = (typeof SPELL_PURPOSES)[number];

export interface Spell {
  /** Index in the two spell flag arrays of a hero. */
  id: number;
  school: SpellSchool;
  level: SpellLevel;
  purpose: SpellPurpose;
  introducedIn: Edition;
}

/** Spells in save file order, 0–69. Titan's Lightning Bolt (57) is not in the older editions. */
export const SPELLS: readonly Spell[] = [
  { id: 0, school: 'water', level: 1, purpose: 'adventure', introducedIn: 'restorationOfErathia' },
  { id: 1, school: 'water', level: 2, purpose: 'adventure', introducedIn: 'restorationOfErathia' },
  { id: 2, school: 'all', level: 2, purpose: 'adventure', introducedIn: 'restorationOfErathia' },
  { id: 3, school: 'earth', level: 1, purpose: 'adventure', introducedIn: 'restorationOfErathia' },
  { id: 4, school: 'air', level: 2, purpose: 'adventure', introducedIn: 'restorationOfErathia' },
  { id: 5, school: 'air', level: 1, purpose: 'adventure', introducedIn: 'restorationOfErathia' },
  { id: 6, school: 'air', level: 5, purpose: 'adventure', introducedIn: 'restorationOfErathia' },
  { id: 7, school: 'water', level: 4, purpose: 'adventure', introducedIn: 'restorationOfErathia' },
  { id: 8, school: 'air', level: 5, purpose: 'adventure', introducedIn: 'restorationOfErathia' },
  { id: 9, school: 'earth', level: 4, purpose: 'adventure', introducedIn: 'restorationOfErathia' },
  {
    id: 10,
    school: 'earth',
    level: 2,
    purpose: 'battlefield',
    introducedIn: 'restorationOfErathia',
  },
  {
    id: 11,
    school: 'fire',
    level: 3,
    purpose: 'battlefield',
    introducedIn: 'restorationOfErathia',
  },
  {
    id: 12,
    school: 'earth',
    level: 3,
    purpose: 'battlefield',
    introducedIn: 'restorationOfErathia',
  },
  {
    id: 13,
    school: 'fire',
    level: 2,
    purpose: 'battlefield',
    introducedIn: 'restorationOfErathia',
  },
  {
    id: 14,
    school: 'earth',
    level: 3,
    purpose: 'battlefield',
    introducedIn: 'restorationOfErathia',
  },
  { id: 15, school: 'all', level: 1, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  { id: 16, school: 'water', level: 2, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  { id: 17, school: 'air', level: 2, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  { id: 18, school: 'earth', level: 5, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  { id: 19, school: 'air', level: 4, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  { id: 20, school: 'water', level: 3, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  { id: 21, school: 'fire', level: 3, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  { id: 22, school: 'fire', level: 4, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  { id: 23, school: 'earth', level: 4, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  { id: 24, school: 'earth', level: 2, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  { id: 25, school: 'air', level: 3, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  { id: 26, school: 'fire', level: 4, purpose: 'damage', introducedIn: 'restorationOfErathia' },
  {
    id: 27,
    school: 'earth',
    level: 1,
    purpose: 'protection',
    introducedIn: 'restorationOfErathia',
  },
  { id: 28, school: 'air', level: 3, purpose: 'protection', introducedIn: 'restorationOfErathia' },
  { id: 29, school: 'fire', level: 4, purpose: 'protection', introducedIn: 'restorationOfErathia' },
  { id: 30, school: 'air', level: 2, purpose: 'protection', introducedIn: 'restorationOfErathia' },
  { id: 31, school: 'fire', level: 1, purpose: 'protection', introducedIn: 'restorationOfErathia' },
  {
    id: 32,
    school: 'water',
    level: 1,
    purpose: 'protection',
    introducedIn: 'restorationOfErathia',
  },
  {
    id: 33,
    school: 'earth',
    level: 3,
    purpose: 'protection',
    introducedIn: 'restorationOfErathia',
  },
  {
    id: 34,
    school: 'earth',
    level: 3,
    purpose: 'protection',
    introducedIn: 'restorationOfErathia',
  },
  { id: 35, school: 'water', level: 1, purpose: 'special', introducedIn: 'restorationOfErathia' },
  { id: 36, school: 'air', level: 5, purpose: 'protection', introducedIn: 'restorationOfErathia' },
  { id: 37, school: 'water', level: 1, purpose: 'healing', introducedIn: 'restorationOfErathia' },
  { id: 38, school: 'earth', level: 4, purpose: 'healing', introducedIn: 'restorationOfErathia' },
  { id: 39, school: 'earth', level: 3, purpose: 'healing', introducedIn: 'restorationOfErathia' },
  { id: 40, school: 'fire', level: 5, purpose: 'healing', introducedIn: 'restorationOfErathia' },
  { id: 41, school: 'water', level: 1, purpose: 'buff', introducedIn: 'restorationOfErathia' },
  { id: 42, school: 'fire', level: 1, purpose: 'weakening', introducedIn: 'restorationOfErathia' },
  { id: 43, school: 'fire', level: 1, purpose: 'buff', introducedIn: 'restorationOfErathia' },
  { id: 44, school: 'air', level: 2, purpose: 'buff', introducedIn: 'restorationOfErathia' },
  { id: 45, school: 'water', level: 2, purpose: 'weakening', introducedIn: 'restorationOfErathia' },
  { id: 46, school: 'earth', level: 1, purpose: 'buff', introducedIn: 'restorationOfErathia' },
  { id: 47, school: 'air', level: 2, purpose: 'weakening', introducedIn: 'restorationOfErathia' },
  { id: 48, school: 'water', level: 4, purpose: 'buff', introducedIn: 'restorationOfErathia' },
  { id: 49, school: 'water', level: 3, purpose: 'buff', introducedIn: 'restorationOfErathia' },
  { id: 50, school: 'earth', level: 4, purpose: 'weakening', introducedIn: 'restorationOfErathia' },
  { id: 51, school: 'air', level: 2, purpose: 'buff', introducedIn: 'restorationOfErathia' },
  { id: 52, school: 'fire', level: 3, purpose: 'weakening', introducedIn: 'restorationOfErathia' },
  { id: 53, school: 'air', level: 1, purpose: 'buff', introducedIn: 'restorationOfErathia' },
  { id: 54, school: 'earth', level: 1, purpose: 'weakening', introducedIn: 'restorationOfErathia' },
  { id: 55, school: 'fire', level: 4, purpose: 'buff', introducedIn: 'restorationOfErathia' },
  { id: 56, school: 'fire', level: 4, purpose: 'buff', introducedIn: 'restorationOfErathia' },
  { id: 57, school: 'air', level: 5, purpose: 'damage', introducedIn: 'shadowOfDeath' },
  { id: 58, school: 'air', level: 4, purpose: 'buff', introducedIn: 'restorationOfErathia' },
  { id: 59, school: 'fire', level: 4, purpose: 'control', introducedIn: 'restorationOfErathia' },
  { id: 60, school: 'air', level: 3, purpose: 'control', introducedIn: 'restorationOfErathia' },
  { id: 61, school: 'water', level: 3, purpose: 'weakening', introducedIn: 'restorationOfErathia' },
  { id: 62, school: 'fire', level: 2, purpose: 'control', introducedIn: 'restorationOfErathia' },
  { id: 63, school: 'water', level: 3, purpose: 'special', introducedIn: 'restorationOfErathia' },
  {
    id: 64,
    school: 'water',
    level: 2,
    purpose: 'battlefield',
    introducedIn: 'restorationOfErathia',
  },
  { id: 65, school: 'water', level: 4, purpose: 'special', introducedIn: 'restorationOfErathia' },
  { id: 66, school: 'fire', level: 5, purpose: 'summoning', introducedIn: 'restorationOfErathia' },
  { id: 67, school: 'earth', level: 5, purpose: 'summoning', introducedIn: 'restorationOfErathia' },
  { id: 68, school: 'water', level: 5, purpose: 'summoning', introducedIn: 'restorationOfErathia' },
  { id: 69, school: 'air', level: 5, purpose: 'summoning', introducedIn: 'restorationOfErathia' },
];

/** Whether a spell shows up in the column of a school: own school, or all four. */
export function isInSchool(spell: Spell, school: MagicSchool): boolean {
  return spell.school === school || spell.school === 'all';
}

/**
 * How likely each spell (by id) is to appear in a mage guild of each faction (TOWNS order),
 * in percent of its level: the guild fills a level by these weights. A 0 never appears there.
 */
export const GUILD_SPELL_CHANCES: readonly (readonly number[])[] = [
  // castle
  [
    3, 6, 2, 3, 2, 3, 0, 10, 0, 10, 4, 8, 4, 4, 4, 30, 50, 4, 0, 10, 16, 8, 5, 10, 0, 12, 0, 10, 4,
    5, 2, 3, 3, 4, 12, 10, 0, 10, 10, 0, 0, 10, 0, 0, 6, 2, 5, 6, 10, 4, 5, 4, 4, 5, 5, 5, 5, 0, 5,
    5, 4, 8, 4, 8, 4, 5, 0, 0, 0, 0,
  ],
  // rampart
  [
    5, 4, 2, 3, 2, 3, 16, 10, 20, 10, 4, 8, 4, 4, 8, 30, 50, 4, 16, 10, 16, 8, 5, 10, 0, 8, 0, 3, 8,
    5, 2, 3, 3, 4, 8, 10, 16, 10, 10, 0, 0, 5, 0, 0, 6, 2, 5, 4, 5, 4, 5, 6, 4, 10, 10, 5, 5, 0, 10,
    5, 4, 8, 6, 8, 4, 5, 0, 16, 16, 0,
  ],
  // tower
  [
    5, 4, 2, 3, 2, 3, 16, 10, 14, 10, 6, 8, 8, 4, 4, 30, 6, 50, 14, 10, 16, 8, 5, 10, 0, 8, 0, 5, 8,
    5, 2, 3, 3, 4, 8, 10, 14, 5, 10, 0, 0, 5, 3, 0, 4, 2, 10, 6, 5, 4, 5, 4, 4, 5, 10, 5, 5, 0, 5,
    5, 8, 4, 2, 8, 6, 10, 0, 14, 14, 14,
  ],
  // inferno
  [
    5, 4, 4, 3, 4, 3, 16, 10, 16, 10, 4, 6, 2, 12, 6, 30, 0, 20, 16, 10, 0, 50, 10, 10, 0, 2, 5, 3,
    2, 5, 4, 3, 3, 2, 4, 10, 0, 5, 10, 0, 20, 0, 5, 10, 8, 8, 5, 12, 0, 2, 5, 4, 6, 5, 10, 5, 5, 0,
    5, 5, 6, 4, 12, 8, 4, 5, 16, 16, 0, 0,
  ],
  // necropolis
  [
    3, 4, 2, 3, 2, 3, 16, 10, 16, 10, 4, 8, 8, 4, 4, 30, 6, 6, 20, 10, 12, 12, 5, 10, 50, 0, 5, 10,
    4, 5, 2, 3, 3, 4, 8, 10, 0, 0, 10, 16, 16, 0, 10, 5, 2, 4, 10, 4, 0, 4, 5, 2, 8, 5, 5, 5, 5, 0,
    5, 10, 0, 4, 4, 8, 4, 5, 0, 16, 0, 16,
  ],
  // dungeon
  [
    5, 4, 2, 3, 2, 3, 12, 10, 16, 10, 4, 12, 8, 4, 4, 30, 6, 50, 12, 10, 12, 16, 5, 10, 0, 4, 10, 5,
    4, 5, 2, 3, 3, 4, 8, 10, 12, 5, 10, 0, 12, 3, 5, 5, 6, 4, 5, 6, 0, 4, 5, 2, 4, 10, 5, 5, 5, 0,
    5, 5, 8, 4, 4, 8, 4, 5, 12, 12, 12, 0,
  ],
  // stronghold
  [
    5, 4, 2, 3, 2, 3, 0, 0, 0, 0, 6, 8, 4, 4, 4, 30, 4, 50, 0, 0, 12, 12, 0, 0, 0, 4, 0, 5, 8, 0, 2,
    3, 3, 4, 12, 10, 0, 5, 0, 0, 0, 3, 0, 10, 4, 4, 10, 6, 0, 12, 0, 4, 4, 5, 5, 0, 0, 0, 0, 0, 4,
    4, 4, 8, 4, 0, 0, 0, 0, 0,
  ],
  // fortress
  [
    3, 4, 2, 3, 0, 3, 0, 0, 0, 0, 6, 2, 4, 4, 50, 30, 50, 4, 0, 0, 4, 2, 0, 0, 0, 2, 0, 5, 4, 0, 2,
    3, 3, 0, 10, 10, 0, 10, 0, 0, 0, 5, 0, 5, 4, 4, 5, 6, 0, 2, 0, 4, 2, 10, 5, 0, 0, 0, 0, 0, 4, 4,
    6, 10, 4, 0, 0, 0, 0, 0,
  ],
  // conflux
  [
    3, 4, 2, 3, 2, 3, 13, 10, 13, 10, 4, 4, 8, 8, 4, 30, 25, 25, 13, 10, 12, 12, 10, 10, 0, 4, 0, 5,
    4, 5, 2, 3, 3, 4, 12, 10, 13, 5, 5, 0, 0, 5, 0, 5, 2, 4, 5, 8, 5, 4, 5, 2, 4, 10, 10, 5, 5, 0,
    5, 5, 12, 8, 8, 8, 4, 10, 12, 12, 12, 12,
  ],
  // cove
  [
    5, 8, 2, 3, 2, 3, 0, 10, 0, 10, 4, 4, 4, 4, 8, 30, 50, 4, 0, 10, 30, 2, 5, 10, 0, 2, 0, 3, 2, 5,
    2, 3, 3, 4, 10, 10, 0, 5, 5, 0, 0, 10, 0, 5, 4, 8, 5, 4, 10, 8, 5, 4, 4, 10, 5, 5, 5, 0, 5, 5,
    4, 8, 0, 10, 4, 10, 0, 0, 0, 0,
  ],
  // factory
  [
    5, 4, 2, 3, 2, 3, 20, 10, 16, 10, 4, 8, 8, 4, 8, 30, 4, 50, 16, 10, 12, 12, 10, 10, 0, 4, 0, 5,
    8, 5, 2, 3, 3, 4, 8, 10, 16, 5, 10, 0, 0, 3, 0, 5, 6, 4, 10, 4, 5, 4, 5, 2, 6, 10, 5, 5, 5, 0,
    5, 5, 4, 4, 8, 10, 4, 5, 0, 16, 0, 16,
  ],
  // bulwark
  [
    5, 6, 2, 3, 2, 3, 0, 10, 0, 10, 4, 2, 8, 4, 8, 30, 50, 4, 0, 10, 16, 2, 5, 10, 0, 4, 0, 3, 8, 5,
    2, 3, 3, 2, 12, 10, 0, 10, 5, 0, 0, 10, 0, 5, 6, 4, 5, 6, 10, 12, 5, 4, 4, 5, 5, 5, 5, 0, 5, 5,
    4, 8, 2, 10, 4, 10, 0, 0, 0, 0,
  ],
];
