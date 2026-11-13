/**
 * Finding a player's treasury, either in the block of player records by color or by the amount
 * of gold (optionally narrowed by other resources), and reading or writing the seven resource
 * values around it.
 */

import { PLAYER_COLORS } from '../data/players';
import {
  MAX_RESOURCE_AMOUNT,
  RESOURCE_OFFSETS,
  RESOURCES,
  type PlayerBlockLayout,
  type Resource,
} from './layouts';
import { u32LittleEndian, type SaveBuffer } from './saveBuffer';

export type ResourceAmounts = Record<Resource, number>;

interface ResourceQuery {
  gold: number;
  /** Other resources that must match exactly, to narrow down the hits. */
  also?: Partial<Omit<ResourceAmounts, 'gold'>>;
}

/** Reads the seven resources around a gold position, or null if they fall outside the file. */
export function readResources(buffer: SaveBuffer, goldPosition: number): ResourceAmounts | null {
  const amounts: Partial<ResourceAmounts> = {};
  for (const resource of RESOURCES) {
    const value = buffer.readU32(goldPosition + RESOURCE_OFFSETS[resource]);
    if (value === undefined) {
      return null;
    }
    amounts[resource] = value;
  }
  return amounts as ResourceAmounts;
}

/** The resources at a gold position if they could be a real treasury, otherwise null. */
function readTreasury(buffer: SaveBuffer, goldPosition: number): ResourceAmounts | null {
  const amounts = readResources(buffer, goldPosition);
  return amounts && RESOURCES.every((resource) => amounts[resource] <= MAX_RESOURCE_AMOUNT)
    ? amounts
    : null;
}

function matches(buffer: SaveBuffer, goldPosition: number, query: ResourceQuery): boolean {
  const amounts = readTreasury(buffer, goldPosition);
  if (!amounts) {
    return false;
  }
  return Object.entries(query.also ?? {}).every(
    ([resource, amount]) => amounts[resource as Resource] === amount,
  );
}

/** Position of the next matching gold value at or after `from`, or null. */
export function findResources(buffer: SaveBuffer, query: ResourceQuery, from = 0): number | null {
  if (!Number.isInteger(query.gold) || query.gold < 1 || query.gold > MAX_RESOURCE_AMOUNT) {
    throw new RangeError('Gold to search for must be between 1 and 999 999 999');
  }
  const pattern = u32LittleEndian(query.gold);
  let offset = buffer.indexOf(pattern, from);
  while (offset !== null) {
    if (matches(buffer, offset, query)) {
      return offset;
    }
    offset = buffer.indexOf(pattern, offset + 1);
  }
  return null;
}

export function writeResources(
  buffer: SaveBuffer,
  goldPosition: number,
  amounts: ResourceAmounts,
): void {
  for (const resource of RESOURCES) {
    const amount = amounts[resource];
    if (!Number.isInteger(amount) || amount < 0 || amount > MAX_RESOURCE_AMOUNT) {
      throw new RangeError(`${resource} must be between 0 and 999 999 999`);
    }
  }
  for (const resource of RESOURCES) {
    buffer.writeU32(goldPosition + RESOURCE_OFFSETS[resource], amounts[resource]);
  }
}

/**
 * Gold positions of the eight players' treasuries, in color order, or null when the save has no
 * such block. The block is eight records `recordSize` bytes apart whose first bytes are the
 * colors 0–7 and whose resources are all possible amounts; the resource check rules out the
 * odd run of color bytes elsewhere in the file.
 */
export function findPlayerTreasuries(
  buffer: SaveBuffer,
  { recordSize, gold }: PlayerBlockLayout,
): number[] | null {
  const bytes = buffer.bytes;
  const last = bytes.length - PLAYER_COLORS.length * recordSize;
  for (let start = 0; start <= last; start += 1) {
    let color = 0;
    while (color < PLAYER_COLORS.length && bytes[start + color * recordSize] === color) {
      color += 1;
    }
    if (color < PLAYER_COLORS.length) {
      continue;
    }
    const golds = PLAYER_COLORS.map((_, index) => start + index * recordSize + gold);
    if (golds.every((position) => readTreasury(buffer, position))) {
      return golds;
    }
  }
  return null;
}
