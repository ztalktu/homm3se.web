/**
 * Finding a player's treasury by the amount of gold, optionally narrowed by other resources,
 * and reading or writing the seven resource values around it.
 */

import { MAX_RESOURCE_AMOUNT, RESOURCE_OFFSETS, RESOURCES, type Resource } from './layouts';
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

function matches(buffer: SaveBuffer, goldPosition: number, query: ResourceQuery): boolean {
  const amounts = readResources(buffer, goldPosition);
  if (!amounts || RESOURCES.some((resource) => amounts[resource] > MAX_RESOURCE_AMOUNT)) {
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
