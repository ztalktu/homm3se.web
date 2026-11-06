/** Reading and writing one hero record around a known position in the save. */

import { MAX_SECONDARY_SKILLS, type SkillLevel } from '../data/skills';
import { SPELLS } from '../data/spells';
import { COMMON_HERO_FIELDS, type HeroLayout } from './layouts';
import { EMPTY_SLOT, type SaveBuffer } from './saveBuffer';
import { decodeText, encodeText, type CodePage } from './textEncoding';

interface Troop {
  creatureId: number;
  count: number;
}

interface SecondarySkill {
  skillId: number;
  level: SkillLevel;
}

export interface Hero {
  name: string;
  classId: number;
  level: number;
  experience: number;
  attack: number;
  defense: number;
  spellPower: number;
  knowledge: number;
  mana: number;
  movementPoints: number;
  maxMovementPoints: number;
  /** Always seven slots, null for an empty one. */
  troops: (Troop | null)[];
  /** In slot order, at most eight. */
  secondarySkills: SecondarySkill[];
  /** Ids of the spells the hero knows. */
  spells: number[];
  hasSpellBook: boolean;
  /** Artifact ids in the backpack, in slot order, at most 64. */
  backpack: number[];
}

/** Thrown when a field around the position falls outside the file: not a real hero. */
class HeroOutOfRangeError extends Error {
  constructor(position: number) {
    super(`No complete hero record around position ${position}`);
  }
}

function u8(buffer: SaveBuffer, offset: number): number {
  const value = buffer.readU8(offset);
  if (value === undefined) {
    throw new HeroOutOfRangeError(offset);
  }
  return value;
}

function u16(buffer: SaveBuffer, offset: number): number {
  const value = buffer.readU16(offset);
  if (value === undefined) {
    throw new HeroOutOfRangeError(offset);
  }
  return value;
}

function u32(buffer: SaveBuffer, offset: number): number {
  const value = buffer.readU32(offset);
  if (value === undefined) {
    throw new HeroOutOfRangeError(offset);
  }
  return value;
}

function readName(
  buffer: SaveBuffer,
  layout: HeroLayout,
  position: number,
  codePage: CodePage,
): string {
  const bytes: number[] = [];
  for (let index = 0; index < layout.nameLength; index += 1) {
    const byte = u8(buffer, position + layout.name + index);
    if (byte === 0) {
      break;
    }
    bytes.push(byte);
  }
  return decodeText(new Uint8Array(bytes), codePage);
}

function readSecondarySkills(
  buffer: SaveBuffer,
  layout: HeroLayout,
  position: number,
): SecondarySkill[] {
  const count = Math.min(u8(buffer, position + layout.secondarySkillCount), MAX_SECONDARY_SKILLS);
  const bySlot = new Map<number, SecondarySkill>();
  for (let skillId = 0; skillId < layout.secondarySkillIds; skillId += 1) {
    const slot = u8(buffer, position + layout.secondarySkillSlots + skillId);
    const level = u8(buffer, position + layout.secondarySkillLevels + skillId);
    if (slot >= 1 && slot <= count && level >= 1 && level <= 3) {
      bySlot.set(slot, { skillId, level: level as SkillLevel });
    }
  }
  return [...bySlot.entries()].sort(([a], [b]) => a - b).map(([, skill]) => skill);
}

/**
 * Reads the hero whose name starts at `position`, with the hero layout of the save
 * (see `layoutFor`).
 */
export function readHero(
  buffer: SaveBuffer,
  position: number,
  layout: HeroLayout,
  codePage: CodePage,
): Hero {
  const troops: (Troop | null)[] = [];
  for (let slot = 0; slot < layout.troopSlots; slot += 1) {
    const creatureId = u32(buffer, position + layout.troopTypes + slot * 4);
    const count = u32(buffer, position + layout.troopCounts + slot * 4);
    troops.push(creatureId === EMPTY_SLOT ? null : { creatureId, count });
  }

  const spells = SPELLS.map((spell) => spell.id).filter(
    (id) =>
      u8(buffer, position + layout.spellsLearned + id) === 1 &&
      u8(buffer, position + layout.spellsAvailable + id) === 1,
  );

  const backpackStart = position + layout.backpack;
  const backpack: number[] = [];
  for (let slot = 0; slot < layout.backpackSlots; slot += 1) {
    const artifactId = u32(buffer, backpackStart + slot * layout.backpackSlotSize);
    if (artifactId !== EMPTY_SLOT) {
      backpack.push(artifactId);
    }
  }

  return {
    name: readName(buffer, layout, position, codePage),
    classId: u8(buffer, position + layout.heroClass),
    level: u8(buffer, position + layout.level),
    experience: u32(buffer, position + layout.experience),
    attack: u8(buffer, position + layout.attack),
    defense: u8(buffer, position + layout.defense),
    spellPower: u8(buffer, position + layout.spellPower),
    knowledge: u8(buffer, position + layout.knowledge),
    mana: u16(buffer, position + layout.mana),
    movementPoints: u32(buffer, position + layout.movementPoints),
    maxMovementPoints: u32(buffer, position + layout.maxMovementPoints),
    troops,
    secondarySkills: readSecondarySkills(buffer, layout, position),
    spells,
    hasSpellBook: u32(buffer, position + layout.spellBookSlot) === 0,
    backpack,
  };
}

/** Thrown when the new name cannot be stored: too long or has characters outside the code page. */
export class InvalidHeroNameError extends Error {
  constructor(readonly heroName: string) {
    super(`Hero name "${heroName}" cannot be written to the save`);
  }
}

/** Encodes a name for the save, padded with NUL bytes to the name field length. */
export function encodeHeroName(name: string, codePage: CodePage): Uint8Array {
  const encoded = encodeText(name, codePage);
  if (!encoded || encoded.length === 0 || encoded.length >= COMMON_HERO_FIELDS.nameLength) {
    throw new InvalidHeroNameError(name);
  }
  const field = new Uint8Array(COMMON_HERO_FIELDS.nameLength);
  field.set(encoded);
  return field;
}

/** Writes every editable field of `hero` back to the record at `position`. */
export function writeHero(
  buffer: SaveBuffer,
  position: number,
  layout: HeroLayout,
  codePage: CodePage,
  hero: Hero,
): void {
  // Validate everything that can fail before the first byte is changed.
  const name = encodeHeroName(hero.name, codePage);
  const backpackStart = position + layout.backpack;
  if (
    !buffer.contains(position + layout.heroClass, -layout.heroClass) ||
    !buffer.contains(backpackStart, layout.backpackSlots * layout.backpackSlotSize)
  ) {
    throw new HeroOutOfRangeError(position);
  }

  buffer.writeBytes(position + layout.name, name);
  buffer.writeU8(position + layout.heroClass, hero.classId);
  buffer.writeU8(position + layout.level, hero.level);
  buffer.writeU32(position + layout.experience, hero.experience);
  buffer.writeU16(position + layout.mana, hero.mana);
  buffer.writeU32(position + layout.movementPoints, hero.movementPoints);
  buffer.writeU32(position + layout.maxMovementPoints, hero.maxMovementPoints);
  buffer.writeU8(position + layout.attack, hero.attack);
  buffer.writeU8(position + layout.defense, hero.defense);
  buffer.writeU8(position + layout.spellPower, hero.spellPower);
  buffer.writeU8(position + layout.knowledge, hero.knowledge);

  for (let slot = 0; slot < layout.troopSlots; slot += 1) {
    const troop = hero.troops[slot] ?? null;
    buffer.writeU32(position + layout.troopTypes + slot * 4, troop ? troop.creatureId : EMPTY_SLOT);
    buffer.writeU32(position + layout.troopCounts + slot * 4, troop ? troop.count : 0);
  }

  const skills = hero.secondarySkills.slice(0, MAX_SECONDARY_SKILLS);
  buffer.writeU8(position + layout.secondarySkillCount, skills.length);
  for (let skillId = 0; skillId < layout.secondarySkillIds; skillId += 1) {
    buffer.writeU8(position + layout.secondarySkillLevels + skillId, 0);
    buffer.writeU8(position + layout.secondarySkillSlots + skillId, 0);
  }
  skills.forEach(({ skillId, level }, index) => {
    buffer.writeU8(position + layout.secondarySkillLevels + skillId, level);
    buffer.writeU8(position + layout.secondarySkillSlots + skillId, index + 1);
  });

  // A spell is known when both flags are 1. Touch the flags only for spells whose state
  // changed: saves sometimes have just one of the two set, and that must survive a rewrite.
  const known = new Set(hero.spells);
  for (const { id } of SPELLS) {
    const learned = position + layout.spellsLearned + id;
    const available = position + layout.spellsAvailable + id;
    const wasKnown = buffer.readU8(learned) === 1 && buffer.readU8(available) === 1;
    if (known.has(id) !== wasKnown) {
      const flag = known.has(id) ? 1 : 0;
      buffer.writeU8(learned, flag);
      buffer.writeU8(available, flag);
    }
  }
  buffer.writeU32(position + layout.spellBookSlot, hero.hasSpellBook ? 0 : EMPTY_SLOT);

  for (let slot = 0; slot < layout.backpackSlots; slot += 1) {
    const artifactId = hero.backpack[slot];
    buffer.writeU32(
      backpackStart + slot * layout.backpackSlotSize,
      artifactId === undefined ? EMPTY_SLOT : artifactId,
    );
  }
}
