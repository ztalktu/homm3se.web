/**
 * Town records: finding the town array in a save, reading a town and writing back what the
 * editor changes (garrison, buildings, mage guild).
 *
 * The records lie one after another, numbered 0, 1, 2… in a byte of their own; the array has
 * no marker in front, so the editor looks for the longest run of records that look like towns.
 */

import { BUILDING } from '../data/buildings';
import { PLAYER_COLORS, type PlayerColor } from '../data/players';
import type { Troop } from './hero';
import {
  COMMON_TOWN_FIELDS,
  TOWN_FIELDS_AFTER_NAME,
  type HeroLayout,
  type TownLayout,
} from './layouts';
import { EMPTY_SLOT, type SaveBuffer } from './saveBuffer';
import { decodeText } from './textEncoding';

/** Buildings are numbered 0–43; no mask in a real save has a higher bit. */
export const BUILDING_COUNT = 44;
const NEUTRAL = 0xff;
const HIGHEST_FACTION = 11;
const HIGHEST_CREATURE_ID = 0xff;
/** A guild level holds at most six spells: five on level 1, one more with a library. */
const MAX_GUILD_SLOTS = 6;
const LONGEST_COUNTED_NAME = 30;
const FIRST_NAME_BYTE = 0x20;
/** Bytes from 0xC0 on are Cyrillic letters in windows-1251 and rare accents in windows-1252. */
const CYRILLIC_FROM = 0xc0;

export interface Town {
  /** Index in the town array, as the record stores it. */
  number: number;
  /** First byte of the record. */
  position: number;
  /** First byte after the name field: the fields of TOWN_FIELDS_AFTER_NAME count from here. */
  afterName: number;
  /** null for a neutral town. */
  owner: PlayerColor | null;
  /** Index in TOWNS. */
  faction: number;
  x: number;
  y: number;
  z: number;
  name: string;
  /** Always seven slots, null for an empty one. */
  garrison: (Troop | null)[];
  /** Built buildings as the first mask stores them: an upgrade clears what it replaces. */
  built: bigint;
  /** Every built building, the replaced ones included. */
  builtAll: bigint;
  /** Buildings the map allows; read only. */
  allowed: bigint;
  /** Spell slots of the guild levels 1–5; 0 for a level not built. */
  guildSlots: number[];
  /** Spell ids by guild level, six slots each; slots past `guildSlots` hold leftovers. */
  guildSpells: number[][];
}

function readU64(buffer: SaveBuffer, offset: number): bigint | undefined {
  const low = buffer.readU32(offset);
  const high = buffer.readU32(offset + 4);
  return low === undefined || high === undefined ? undefined : (BigInt(high) << 32n) | BigInt(low);
}

function writeU64(buffer: SaveBuffer, offset: number, value: bigint): void {
  buffer.writeU32(offset, Number(value & 0xffffffffn));
  buffer.writeU32(offset + 4, Number(value >> 32n));
}

/** Where the name lies and where the record ends, or null when the name does not look real. */
function nameField(
  buffer: SaveBuffer,
  position: number,
  layout: TownLayout,
): { start: number; length: number; afterName: number; next: number } | null {
  const fieldStart = position + COMMON_TOWN_FIELDS.name;
  if (layout.name === 'counted') {
    const length = buffer.readU16(fieldStart);
    if (length === undefined || length < 1 || length > LONGEST_COUNTED_NAME) {
      return null;
    }
    const start = fieldStart + 2;
    return {
      start,
      length,
      afterName: start + length,
      next: position + layout.recordSize + length,
    };
  }
  let length = 0;
  while (length < layout.name && buffer.readU8(fieldStart + length) !== 0) {
    length += 1;
  }
  if (length === 0 || length === layout.name) {
    return null;
  }
  return {
    start: fieldStart,
    length,
    afterName: fieldStart + layout.name,
    next: position + layout.recordSize,
  };
}

/** True when every name byte is a printable character. */
function namePrintable(buffer: SaveBuffer, start: number, length: number): boolean {
  for (let index = 0; index < length; index += 1) {
    const byte = buffer.readU8(start + index);
    if (byte === undefined || byte < FIRST_NAME_BYTE || byte === 0x7f) {
      return false;
    }
  }
  return true;
}

function garrisonLooksReal(buffer: SaveBuffer, position: number): boolean {
  for (let slot = 0; slot < COMMON_TOWN_FIELDS.garrisonSlots; slot += 1) {
    const type = buffer.readU32(position + COMMON_TOWN_FIELDS.garrisonTypes + slot * 4);
    const count = buffer.readU32(position + COMMON_TOWN_FIELDS.garrisonCounts + slot * 4);
    if (type === undefined || count === undefined) {
      return false;
    }
    const empty = type === EMPTY_SLOT;
    if (empty ? count !== 0 : type > HIGHEST_CREATURE_ID || count === 0 || count > 0x7fffffff) {
      return false;
    }
  }
  return true;
}

function fieldsAfterNameLookReal(buffer: SaveBuffer, afterName: number): boolean {
  for (let level = 0; level < TOWN_FIELDS_AFTER_NAME.guildLevels; level += 1) {
    const slots = buffer.readU8(afterName + TOWN_FIELDS_AFTER_NAME.guildSlots + level);
    if (slots === undefined || slots > MAX_GUILD_SLOTS) {
      return false;
    }
  }
  // Every town has the Village Hall in the full mask. The first mask can hold bits the full one
  // does not (bits of no known building), and the allowed mask can be 0.
  const limit = 1n << BigInt(BUILDING_COUNT);
  const built = readU64(buffer, afterName + TOWN_FIELDS_AFTER_NAME.built);
  const builtAll = readU64(buffer, afterName + TOWN_FIELDS_AFTER_NAME.builtAll);
  const allowed = readU64(buffer, afterName + TOWN_FIELDS_AFTER_NAME.allowed);
  return (
    built !== undefined &&
    builtAll !== undefined &&
    allowed !== undefined &&
    built < limit &&
    builtAll < limit &&
    allowed < limit &&
    (builtAll & (1n << BigInt(BUILDING.villageHall))) !== 0n
  );
}

/** The next record's position when a town record numbered `number` starts here, or null. */
function recordAt(
  buffer: SaveBuffer,
  position: number,
  layout: TownLayout,
  number: number,
): number | null {
  const owner = buffer.readU8(position + COMMON_TOWN_FIELDS.owner);
  const faction = buffer.readU8(position + COMMON_TOWN_FIELDS.faction);
  if (
    buffer.readU8(position + COMMON_TOWN_FIELDS.number) !== number ||
    owner === undefined ||
    (owner >= PLAYER_COLORS.length && owner !== NEUTRAL) ||
    faction === undefined ||
    faction > HIGHEST_FACTION ||
    !garrisonLooksReal(buffer, position)
  ) {
    return null;
  }
  const name = nameField(buffer, position, layout);
  if (
    !name ||
    !namePrintable(buffer, name.start, name.length) ||
    !fieldsAfterNameLookReal(buffer, name.afterName)
  ) {
    return null;
  }
  return name.next;
}

/** Positions of the records of the longest run of towns numbered from 0; the first one wins a tie. */
export function findTownPositions(buffer: SaveBuffer, layout: TownLayout): number[] {
  let best: number[] = [];
  const bytes = buffer.bytes;
  for (let position = 0; position + COMMON_TOWN_FIELDS.name < bytes.length; position += 1) {
    if (bytes[position + COMMON_TOWN_FIELDS.number] !== 0) {
      continue;
    }
    const run: number[] = [];
    let current: number | null = position;
    while (current !== null && run.length < 0x100) {
      const next = recordAt(buffer, current, layout, run.length);
      if (next === null) {
        break;
      }
      run.push(current);
      current = next;
    }
    if (run.length > best.length) {
      best = run;
    }
  }
  return best;
}

/** Names are in the code page of the game; a Cyrillic byte tells a Russian one. */
function decodeName(bytes: Uint8Array): string {
  return decodeText(
    bytes,
    bytes.some((byte) => byte >= CYRILLIC_FROM) ? 'windows-1251' : 'windows-1252',
  );
}

function required<T>(value: T | undefined, position: number): T {
  if (value === undefined) {
    throw new RangeError(`No complete town record at ${position}`);
  }
  return value;
}

/** Reads the town record at `position`, one of `findTownPositions`. */
export function readTown(buffer: SaveBuffer, position: number, layout: TownLayout): Town {
  const name = required(nameField(buffer, position, layout) ?? undefined, position);
  const u8 = (offset: number): number => required(buffer.readU8(offset), position);
  const u32 = (offset: number): number => required(buffer.readU32(offset), position);
  const u64 = (offset: number): bigint => required(readU64(buffer, offset), position);
  const after = name.afterName;
  const ownerByte = u8(position + COMMON_TOWN_FIELDS.owner);

  const garrison: (Troop | null)[] = [];
  for (let slot = 0; slot < COMMON_TOWN_FIELDS.garrisonSlots; slot += 1) {
    const creatureId = u32(position + COMMON_TOWN_FIELDS.garrisonTypes + slot * 4);
    const count = u32(position + COMMON_TOWN_FIELDS.garrisonCounts + slot * 4);
    garrison.push(creatureId === EMPTY_SLOT ? null : { creatureId, count });
  }

  const { guildLevels, guildSlotsPerLevel } = TOWN_FIELDS_AFTER_NAME;
  return {
    number: u8(position + COMMON_TOWN_FIELDS.number),
    position,
    afterName: after,
    owner: PLAYER_COLORS[ownerByte] ?? null,
    faction: u8(position + COMMON_TOWN_FIELDS.faction),
    x: u8(position + COMMON_TOWN_FIELDS.x),
    y: u8(position + COMMON_TOWN_FIELDS.y),
    z: u8(position + COMMON_TOWN_FIELDS.z),
    name: decodeName(buffer.bytes.slice(name.start, name.start + name.length)),
    garrison,
    built: u64(after + TOWN_FIELDS_AFTER_NAME.built),
    builtAll: u64(after + TOWN_FIELDS_AFTER_NAME.builtAll),
    allowed: u64(after + TOWN_FIELDS_AFTER_NAME.allowed),
    guildSlots: Array.from({ length: guildLevels }, (_, level) =>
      u8(after + TOWN_FIELDS_AFTER_NAME.guildSlots + level),
    ),
    guildSpells: Array.from({ length: guildLevels }, (_, level) =>
      Array.from({ length: guildSlotsPerLevel }, (_, slot) =>
        u32(after + TOWN_FIELDS_AFTER_NAME.guildSpells + (level * guildSlotsPerLevel + slot) * 4),
      ),
    ),
  };
}

/** All towns of the save, in array order. */
export function findTowns(buffer: SaveBuffer, layout: TownLayout): Town[] {
  return findTownPositions(buffer, layout).map((position) => readTown(buffer, position, layout));
}

/**
 * Writes what the editor changes: the garrison, both building masks and the mage guild. The
 * map's allowed mask and everything else stay as they are.
 */
export function writeTown(buffer: SaveBuffer, town: Town): void {
  const { position, afterName } = town;
  for (let slot = 0; slot < COMMON_TOWN_FIELDS.garrisonSlots; slot += 1) {
    const troop = town.garrison[slot] ?? null;
    buffer.writeU32(
      position + COMMON_TOWN_FIELDS.garrisonTypes + slot * 4,
      troop ? troop.creatureId : EMPTY_SLOT,
    );
    buffer.writeU32(
      position + COMMON_TOWN_FIELDS.garrisonCounts + slot * 4,
      troop ? troop.count : 0,
    );
  }
  writeU64(buffer, afterName + TOWN_FIELDS_AFTER_NAME.built, town.built);
  writeU64(buffer, afterName + TOWN_FIELDS_AFTER_NAME.builtAll, town.builtAll);
  const { guildLevels, guildSlotsPerLevel } = TOWN_FIELDS_AFTER_NAME;
  for (let level = 0; level < guildLevels; level += 1) {
    buffer.writeU8(
      afterName + TOWN_FIELDS_AFTER_NAME.guildSlots + level,
      town.guildSlots[level] ?? 0,
    );
    for (let slot = 0; slot < guildSlotsPerLevel; slot += 1) {
      const spell = town.guildSpells[level]?.[slot];
      if (spell !== undefined) {
        buffer.writeU32(
          afterName + TOWN_FIELDS_AFTER_NAME.guildSpells + (level * guildSlotsPerLevel + slot) * 4,
          spell,
        );
      }
    }
  }
}

/** Where a hero stands, read at the hero layout's coordinates. */
export interface HeroPlace {
  x: number;
  y: number;
  z: number;
  /** True for a hero on the map (a visitor in a town), false in a garrison or inactive. */
  onMap: boolean;
}

export function readHeroPlace(
  buffer: SaveBuffer,
  position: number,
  layout: HeroLayout,
): HeroPlace | null {
  const at = position + layout.coordinates;
  const x = buffer.readU16(at);
  const y = buffer.readU16(at + 2);
  const z = buffer.readU8(at + 4);
  const onMap = buffer.readU8(at + 6);
  return x === undefined || y === undefined || z === undefined || onMap === undefined
    ? null
    : { x, y, z, onMap: onMap === 1 };
}

/** A hero on the town's tile: as a visitor when on the map, in the garrison otherwise. */
export function isHeroInTown(place: HeroPlace, town: Town): boolean {
  return place.x === town.x && place.y === town.y && place.z === town.z;
}
