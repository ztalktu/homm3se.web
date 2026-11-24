/**
 * Presets kept in the browser: hero, town and treasury ones apart, newest first. A preset with
 * the name of another of its kind replaces it.
 */

import { EDITIONS, type Edition } from '../data/editions';
import { RESOURCES } from '../core/layouts';
import { HERO_ATTRIBUTES, type HeroPresetData, type TownPresetData } from '../core/presets';
import type { ResourceAmounts } from '../core/resources';
import { readJson, writeJson } from '../storage/localStore';

export interface PresetData {
  hero: HeroPresetData;
  town: TownPresetData;
  resources: Partial<ResourceAmounts>;
}
export type PresetKind = keyof PresetData;

export interface Preset<Kind extends PresetKind> {
  name: string;
  /** When it was saved, ms since epoch. */
  savedAt: number;
  /** Edition of the save it was taken from: ids mean different things in different ones. */
  edition: Edition;
  data: PresetData[Kind];
}

interface StoredPresets<Kind extends PresetKind> {
  version: 1;
  presets: Preset<Kind>[];
}

// ---------- validation of what was read back ----------

type Check = (value: unknown) => boolean;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isCount: Check = (value) => Number.isInteger(value) && (value as number) >= 0;
const arrayOf =
  (item: Check): Check =>
  (value) =>
    Array.isArray(value) && value.every(item);
const optional =
  (check: Check): Check =>
  (value) =>
    value === undefined || check(value);
const isTroop: Check = (value) =>
  value === null || (isRecord(value) && isCount(value['creatureId']) && isCount(value['count']));
const isSkill: Check = (value) =>
  isRecord(value) && isCount(value['skillId']) && [1, 2, 3].includes(value['level'] as number);
const isSlot: Check = (value) => value === null || isCount(value);

function isAttributes(value: unknown): boolean {
  return (
    isRecord(value) &&
    Object.entries(value).every(([field, item]) =>
      field === 'name'
        ? typeof item === 'string'
        : (HERO_ATTRIBUTES as readonly string[]).includes(field) && isCount(item),
    )
  );
}

const DATA_CHECKS: Record<PresetKind, Check> = {
  hero: (value) =>
    isRecord(value) &&
    optional(isAttributes)(value['attributes']) &&
    optional(arrayOf(isTroop))(value['troops']) &&
    optional(arrayOf(isSkill))(value['skills']) &&
    optional(arrayOf(isSlot))(value['equipment']) &&
    optional(arrayOf(isCount))(value['backpack']) &&
    optional(
      (spells) =>
        isRecord(spells) &&
        arrayOf(isCount)(spells['spells']) &&
        typeof spells['hasSpellBook'] === 'boolean',
    )(value['spells']),
  town: (value) =>
    isRecord(value) &&
    isCount(value['faction']) &&
    optional(arrayOf(isCount))(value['buildings']) &&
    optional(arrayOf(isTroop))(value['garrison']) &&
    optional(arrayOf(arrayOf(isCount)))(value['guild']),
  resources: (value) =>
    isRecord(value) &&
    Object.entries(value).every(
      ([resource, amount]) =>
        (RESOURCES as readonly string[]).includes(resource) && isCount(amount),
    ),
};

function isPreset(kind: PresetKind): Check {
  return (value) =>
    isRecord(value) &&
    typeof value['name'] === 'string' &&
    value['name'].trim() !== '' &&
    typeof value['savedAt'] === 'number' &&
    EDITIONS.includes(value['edition'] as Edition) &&
    DATA_CHECKS[kind](value['data']);
}

function read<Kind extends PresetKind>(kind: Kind): Preset<Kind>[] {
  const valid = isPreset(kind);
  const stored = readJson<StoredPresets<Kind> | null>(
    `presets.${kind}`,
    null,
    (value): value is StoredPresets<Kind> =>
      isRecord(value) && value['version'] === 1 && Array.isArray(value['presets']),
  );
  // A broken preset is dropped alone, the others stay.
  return (stored?.presets ?? []).filter(valid);
}

const store: { [Kind in PresetKind]: Preset<Kind>[] } = $state({
  hero: read('hero'),
  town: read('town'),
  resources: read('resources'),
});

function remember(kind: PresetKind): void {
  writeJson(`presets.${kind}`, { version: 1, presets: $state.snapshot(store[kind]) });
}

/** Presets of a kind, newest first. */
export function presetsOf<Kind extends PresetKind>(kind: Kind): readonly Preset<Kind>[] {
  return store[kind];
}

export function savePreset<Kind extends PresetKind>(kind: Kind, preset: Preset<Kind>): void {
  const others = (store[kind] as Preset<Kind>[]).filter((known) => known.name !== preset.name);
  (store[kind] as Preset<Kind>[]) = [preset, ...others];
  remember(kind);
}

export function deletePreset(kind: PresetKind, name: string): void {
  (store[kind] as Preset<PresetKind>[]) = store[kind].filter((known) => known.name !== name);
  remember(kind);
}
