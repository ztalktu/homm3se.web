/**
 * Offsets that are the same in every save layout the editor knows: the hero fields shared by
 * all hero records, and the seven resources of a treasury.
 */

/**
 * Hero fields relative to the first byte of the hero name. They match in Restoration of
 * Erathia, HD Edition, Armageddon's Blade and The Shadow of Death; a layout file adds what
 * differs (backpack, equipment, combination artifacts). Horn of the Abyss also replaces the
 * secondary skill fields.
 */
export const COMMON_HERO_FIELDS = {
  /** Name, NUL-terminated. The 2.05 editor wrote 14 bytes here. */
  name: 0,
  nameLength: 13,
  /** u8, player color 0–7 (see PLAYER_COLORS), 0xFF when nobody owns the hero */
  owner: -169,
  /** u8 */
  heroClass: -158,
  /** u32 */
  experience: -130,
  /** u32, movement points for a full day */
  maxMovementPoints: -138,
  /** u32, movement points left today (2.05 wrote a u8 at -133, the second byte of this) */
  movementPoints: -134,
  /** u8, number of secondary skills */
  secondarySkillCount: -126,
  /** u16 */
  mana: -122,
  /** u8 */
  level: -120,
  /** 7 × u32 creature id, EMPTY_SLOT for an empty slot */
  troopTypes: -56,
  /** 7 × u32 creature count */
  troopCounts: -28,
  troopSlots: 7,
  /** u8 skill level (0 none, 1 basic, 2 advanced, 3 expert) per skill id */
  secondarySkillLevels: 13,
  /** u8 slot number (1–8, 0 if the hero does not have the skill) per skill id */
  secondarySkillSlots: 41,
  /** Number of entries in both secondary skill arrays. */
  secondarySkillIds: 28,
  /** u8 each */
  attack: 69,
  defense: 70,
  spellPower: 71,
  knowledge: 72,
  /** 70 × u8 flags; a spell is known when the flag is 1 in both arrays */
  spellsLearned: 73,
  spellsAvailable: 143,
  /** First equipment slot (helmet); each slot is 8 bytes: u32 artifact id, u32 extra value. */
  equipment: 213,
  /** u32 artifact id in the spell book slot: 0 is the spell book, EMPTY_SLOT means no book */
  spellBookSlot: 349,
  /** 64 backpack slots of 8 bytes, the artifact id is the first u32 */
  backpackSlotSize: 8,
  backpackSlots: 64,
  /** u16 X, u16 Y, u8 Z, then the "on the map" flag two bytes on (Restoration of Erathia: -189) */
  coordinates: -195,
} as const;

/**
 * Town fields relative to the first byte of the record, the same in every layout, and the
 * fields after the name, relative to the end of the name field.
 */
export const COMMON_TOWN_FIELDS = {
  /** u8, the town's index in the array: 0, 1, 2… */
  number: 0x08,
  /** u8, player color 0–7, 0xFF for a neutral town */
  owner: 0x09,
  /** u8, faction in TOWNS order */
  faction: 0x0c,
  /** u8 each */
  x: 0x0d,
  y: 0x0e,
  z: 0x0f,
  /** 7 × i32 creature id, EMPTY_SLOT for an empty slot */
  garrisonTypes: 0x12,
  /** 7 × i32 creature count, 0 in an empty slot */
  garrisonCounts: 0x2e,
  garrisonSlots: 7,
  /** The name field, see TownLayout.name. */
  name: 0x4e,
} as const;

export const TOWN_FIELDS_AFTER_NAME = {
  /** 5 × u8: spell slots of the mage guild levels 1–5, 0 for a level not built */
  guildSlots: 0x54,
  /** u64: built buildings; an upgrade clears the bit of what it replaces */
  built: 0x59,
  /** u64: every built building, the replaced ones included */
  builtAll: 0x61,
  /** u64: buildings the map allows */
  allowed: 0x69,
  /** 5 × 6 × i32: guild spells by level; slots past the level's count hold leftovers */
  guildSpells: 0x71,
  guildLevels: 5,
  guildSlotsPerLevel: 6,
} as const;

/** The spell flags the hero search checks to tell a real hero from a random name match. */
export const SEARCH_CHECKED_SPELLS = 69;

/**
 * The seven resources are consecutive i32 values, in the same order in every layout;
 * offsets are relative to gold.
 */
export const RESOURCE_OFFSETS = {
  wood: -24,
  mercury: -20,
  ore: -16,
  sulfur: -12,
  crystal: -8,
  gems: -4,
  gold: 0,
} as const;

export type Resource = keyof typeof RESOURCE_OFFSETS;
export const RESOURCES = Object.keys(RESOURCE_OFFSETS) as Resource[];

/** The resources besides gold, which narrow a search by amounts. */
export type OtherResource = Exclude<Resource, 'gold'>;
export const OTHER_RESOURCES = RESOURCES.filter(
  (resource): resource is OtherResource => resource !== 'gold',
);

/** Values above this are not real resources, so the search skips such hits. */
export const MAX_RESOURCE_AMOUNT = 999_999_999;
