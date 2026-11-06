/**
 * Offsets that are the same in every save layout the editor knows: the hero fields shared by
 * all hero records, and the seven resources of a treasury. See saves/FORMAT.md §3, §4.2.
 */

/**
 * Hero fields relative to the first byte of the hero name. They match in Restoration of
 * Erathia, HD Edition, Armageddon's Blade and The Shadow of Death; a layout file adds what
 * differs (backpack, equipment, combination artifacts).
 */
export const COMMON_HERO_FIELDS = {
  /** Name, NUL-terminated. The 2.05 editor wrote 14 bytes here. */
  name: 0,
  nameLength: 13,
  /** u8 */
  heroClass: -158,
  /** u32 */
  experience: -130,
  /** u8, movement points left (as 2.05 wrote it; the real field is a u32 at -134) */
  movementPoints: -133,
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

/** Values above this are not real resources, so the search skips such hits. */
export const MAX_RESOURCE_AMOUNT = 999_999_999;
