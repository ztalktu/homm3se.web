/** Reading and writing one hero record around a known position in the save. */

import { SECONDARY_SKILL_COUNT, MAX_SECONDARY_SKILLS, type SkillLevel } from '../data/skills';
import { SPELLS } from '../data/spells';
import { HERO_LAYOUT as L } from './layout';
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

function readName(buffer: SaveBuffer, position: number, codePage: CodePage): string {
  const bytes: number[] = [];
  for (let index = 0; index < L.nameLength; index += 1) {
    const byte = u8(buffer, position + L.name + index);
    if (byte === 0) {
      break;
    }
    bytes.push(byte);
  }
  return decodeText(new Uint8Array(bytes), codePage);
}

function readSecondarySkills(buffer: SaveBuffer, position: number): SecondarySkill[] {
  const count = Math.min(u8(buffer, position + L.secondarySkillCount), MAX_SECONDARY_SKILLS);
  const bySlot = new Map<number, SecondarySkill>();
  for (let skillId = 0; skillId < SECONDARY_SKILL_COUNT; skillId += 1) {
    const slot = u8(buffer, position + L.secondarySkillSlots + skillId);
    const level = u8(buffer, position + L.secondarySkillLevels + skillId);
    if (slot >= 1 && slot <= count && level >= 1 && level <= 3) {
      bySlot.set(slot, { skillId, level: level as SkillLevel });
    }
  }
  return [...bySlot.entries()].sort(([a], [b]) => a - b).map(([, skill]) => skill);
}

/**
 * Reads the hero whose name starts at `position`.
 * `backpackOffset` depends on the save format, see `backpackOffsetFor`.
 */
export function readHero(
  buffer: SaveBuffer,
  position: number,
  backpackOffset: number,
  codePage: CodePage,
): Hero {
  const troops: (Troop | null)[] = [];
  for (let slot = 0; slot < L.troopSlots; slot += 1) {
    const creatureId = u32(buffer, position + L.troopTypes + slot * 4);
    const count = u32(buffer, position + L.troopCounts + slot * 4);
    troops.push(creatureId === EMPTY_SLOT ? null : { creatureId, count });
  }

  const spells = SPELLS.map((spell) => spell.id).filter(
    (id) =>
      u8(buffer, position + L.spellsLearned + id) === 1 &&
      u8(buffer, position + L.spellsAvailable + id) === 1,
  );

  const backpackStart = position + backpackOffset;
  const backpack: number[] = [];
  for (let slot = 0; slot < L.backpackSlots; slot += 1) {
    const artifactId = u32(buffer, backpackStart + slot * L.backpackSlotSize);
    if (artifactId !== EMPTY_SLOT) {
      backpack.push(artifactId);
    }
  }

  return {
    name: readName(buffer, position, codePage),
    classId: u8(buffer, position + L.heroClass),
    level: u8(buffer, position + L.level),
    experience: u32(buffer, position + L.experience),
    attack: u8(buffer, position + L.attack),
    defense: u8(buffer, position + L.defense),
    spellPower: u8(buffer, position + L.spellPower),
    knowledge: u8(buffer, position + L.knowledge),
    mana: u16(buffer, position + L.mana),
    movementPoints: u8(buffer, position + L.movementPoints),
    troops,
    secondarySkills: readSecondarySkills(buffer, position),
    spells,
    hasSpellBook: u32(buffer, position + L.spellBookSlot) === 0,
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
  if (!encoded || encoded.length === 0 || encoded.length >= L.nameLength) {
    throw new InvalidHeroNameError(name);
  }
  const field = new Uint8Array(L.nameLength);
  field.set(encoded);
  return field;
}

/** Writes every editable field of `hero` back to the record at `position`. */
export function writeHero(
  buffer: SaveBuffer,
  position: number,
  backpackOffset: number,
  codePage: CodePage,
  hero: Hero,
): void {
  // Validate everything that can fail before the first byte is changed.
  const name = encodeHeroName(hero.name, codePage);
  const backpackStart = position + backpackOffset;
  if (
    !buffer.contains(position + L.heroClass, -L.heroClass) ||
    !buffer.contains(backpackStart, L.backpackSlots * L.backpackSlotSize)
  ) {
    throw new HeroOutOfRangeError(position);
  }

  buffer.writeBytes(position + L.name, name);
  buffer.writeU8(position + L.heroClass, hero.classId);
  buffer.writeU8(position + L.level, hero.level);
  buffer.writeU32(position + L.experience, hero.experience);
  buffer.writeU16(position + L.mana, hero.mana);
  buffer.writeU8(position + L.movementPoints, hero.movementPoints);
  buffer.writeU8(position + L.attack, hero.attack);
  buffer.writeU8(position + L.defense, hero.defense);
  buffer.writeU8(position + L.spellPower, hero.spellPower);
  buffer.writeU8(position + L.knowledge, hero.knowledge);

  for (let slot = 0; slot < L.troopSlots; slot += 1) {
    const troop = hero.troops[slot] ?? null;
    buffer.writeU32(position + L.troopTypes + slot * 4, troop ? troop.creatureId : EMPTY_SLOT);
    buffer.writeU32(position + L.troopCounts + slot * 4, troop ? troop.count : 0);
  }

  const skills = hero.secondarySkills.slice(0, MAX_SECONDARY_SKILLS);
  buffer.writeU8(position + L.secondarySkillCount, skills.length);
  for (let skillId = 0; skillId < SECONDARY_SKILL_COUNT; skillId += 1) {
    buffer.writeU8(position + L.secondarySkillLevels + skillId, 0);
    buffer.writeU8(position + L.secondarySkillSlots + skillId, 0);
  }
  skills.forEach(({ skillId, level }, index) => {
    buffer.writeU8(position + L.secondarySkillLevels + skillId, level);
    buffer.writeU8(position + L.secondarySkillSlots + skillId, index + 1);
  });

  // A spell is known when both flags are 1. Touch the flags only for spells whose state
  // changed: saves sometimes have just one of the two set, and that must survive a rewrite.
  const known = new Set(hero.spells);
  for (const { id } of SPELLS) {
    const learned = position + L.spellsLearned + id;
    const available = position + L.spellsAvailable + id;
    const wasKnown = buffer.readU8(learned) === 1 && buffer.readU8(available) === 1;
    if (known.has(id) !== wasKnown) {
      const flag = known.has(id) ? 1 : 0;
      buffer.writeU8(learned, flag);
      buffer.writeU8(available, flag);
    }
  }
  buffer.writeU32(position + L.spellBookSlot, hero.hasSpellBook ? 0 : EMPTY_SLOT);

  for (let slot = 0; slot < L.backpackSlots; slot += 1) {
    const artifactId = hero.backpack[slot];
    buffer.writeU32(
      backpackStart + slot * L.backpackSlotSize,
      artifactId === undefined ? EMPTY_SLOT : artifactId,
    );
  }
}
