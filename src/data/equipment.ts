/**
 * What a hero wears: the equipment slots in save order, which artifact goes into which slot,
 * and the combination artifacts with the slots they take besides their own.
 */
import { isHotaArtifact } from './artifacts';
import type { Edition } from './editions';

/** Kinds of slots an artifact can be made for. */
export type SlotKind =
  | 'head'
  | 'shoulders'
  | 'neck'
  | 'weapon'
  | 'shield'
  | 'torso'
  | 'ring'
  | 'feet'
  | 'misc'
  | 'ballista'
  | 'ammoCart'
  | 'firstAidTent'
  | 'catapult'
  | 'spellBook';

export type EquipmentSlotKey =
  | 'head'
  | 'shoulders'
  | 'neck'
  | 'rightHand'
  | 'leftHand'
  | 'torso'
  | 'ring1'
  | 'ring2'
  | 'feet'
  | 'misc1'
  | 'misc2'
  | 'misc3'
  | 'misc4'
  | 'ballista'
  | 'ammoCart'
  | 'firstAidTent'
  | 'catapult'
  | 'spellBook'
  | 'misc5';

interface EquipmentSlot {
  key: EquipmentSlotKey;
  kind: SlotKind;
}

/**
 * Equipment slots in save order: slot `i` is 8 bytes at `equipment + 8 * i`. The spell book
 * (17) is edited as a flag of its own; the fifth misc slot (18) exists from The Shadow of Death.
 */
export const EQUIPMENT_SLOTS: readonly EquipmentSlot[] = [
  { key: 'head', kind: 'head' },
  { key: 'shoulders', kind: 'shoulders' },
  { key: 'neck', kind: 'neck' },
  { key: 'rightHand', kind: 'weapon' },
  { key: 'leftHand', kind: 'shield' },
  { key: 'torso', kind: 'torso' },
  { key: 'ring1', kind: 'ring' },
  { key: 'ring2', kind: 'ring' },
  { key: 'feet', kind: 'feet' },
  { key: 'misc1', kind: 'misc' },
  { key: 'misc2', kind: 'misc' },
  { key: 'misc3', kind: 'misc' },
  { key: 'misc4', kind: 'misc' },
  { key: 'ballista', kind: 'ballista' },
  { key: 'ammoCart', kind: 'ammoCart' },
  { key: 'firstAidTent', kind: 'firstAidTent' },
  { key: 'catapult', kind: 'catapult' },
  { key: 'spellBook', kind: 'spellBook' },
  { key: 'misc5', kind: 'misc' },
];

export const SPELL_BOOK_SLOT = 17;

/** The slots a hero wears artifacts in, without the war machines and the spell book. */
export const WORN_SLOT_KINDS = [
  'head',
  'shoulders',
  'neck',
  'weapon',
  'shield',
  'torso',
  'ring',
  'feet',
  'misc',
] as const satisfies readonly SlotKind[];

export type WornSlotKind = (typeof WORN_SLOT_KINDS)[number];

/** An equipment slot with its index in the save. */
interface IndexedSlot extends EquipmentSlot {
  index: number;
}

const INDEXED_SLOTS: readonly IndexedSlot[] = EQUIPMENT_SLOTS.map((slot, index) => ({
  ...slot,
  index,
}));
const isWornKind = (kind: SlotKind): boolean =>
  (WORN_SLOT_KINDS as readonly SlotKind[]).includes(kind);

/** Slots that hold worn artifacts: all but the war machines and the spell book. */
export const WORN_SLOTS = INDEXED_SLOTS.filter((slot) => isWornKind(slot.kind));

/** The four war machine slots; the Cannon of Horn of the Abyss goes into the Ballista's. */
export const WAR_MACHINE_SLOTS = INDEXED_SLOTS.filter(
  (slot) => !isWornKind(slot.kind) && slot.index !== SPELL_BOOK_SLOT,
);

export const isWarMachineSlot = (slot: number): boolean =>
  WAR_MACHINE_SLOTS.some(({ index }) => index === slot);

/** Classic artifacts (ids 0–140) by slot kind, as ranges [first, last] or single ids. */
const CLASSIC_SLOTS: Readonly<Record<SlotKind, readonly (number | [number, number])[]>> = {
  spellBook: [0],
  catapult: [3],
  ballista: [4],
  ammoCart: [5],
  firstAidTent: [6],
  weapon: [[7, 12], 35, 38, 128, 129, 135],
  shield: [[13, 18], 34, 39],
  head: [[19, 24], 36, 44, 123, 124, 136],
  torso: [[25, 31], 40, 132, 134],
  feet: [32, 41, 56, 59, 90, 98],
  neck: [33, 43, 54, 57, 66, 71, 76, 97, [100, 108]],
  ring: [37, 45, 67, 69, 70, 77, 94, 95, 110, 113, 139],
  shoulders: [42, 55, 58, 68, 72, 78, 83, 99, 109, 130],
  misc: [
    1,
    [46, 53],
    [60, 65],
    [73, 75],
    [79, 82],
    [84, 89],
    [91, 93],
    96,
    [111, 112],
    [114, 122],
    [125, 127],
    131,
    133,
    [137, 138],
    140,
  ],
};

/** Horn of the Abyss artifacts by slot kind. */
const HOTA_SLOTS: ReadonlyMap<number, SlotKind> = new Map([
  [141, 'shoulders'],
  [142, 'neck'],
  [143, 'weapon'],
  [146, 'ballista'],
  [147, 'weapon'],
  [148, 'shield'],
  [149, 'torso'],
  [150, 'head'],
  [151, 'feet'],
  [152, 'misc'],
  [153, 'misc'],
  [154, 'misc'],
  [155, 'misc'],
  [156, 'ring'],
  [157, 'neck'],
  [158, 'ring'],
  [159, 'shoulders'],
  [160, 'misc'],
  [161, 'misc'],
  [162, 'misc'],
  [163, 'ring'],
  [164, 'torso'],
  [165, 'misc'],
]);

const CLASSIC_SLOT_BY_ID: ReadonlyMap<number, SlotKind> = new Map(
  Object.entries(CLASSIC_SLOTS).flatMap(([kind, entries]) =>
    entries.flatMap((entry) => {
      const [first, last] = typeof entry === 'number' ? [entry, entry] : entry;
      return Array.from({ length: last - first + 1 }, (_, index): [number, SlotKind] => [
        first + index,
        kind as SlotKind,
      ]);
    }),
  ),
);

/** The kind of slot an artifact is worn in, or null for one no hero can wear (the Grail). */
export function artifactSlotKind(artifactId: number, edition: Edition): SlotKind | null {
  if (isHotaArtifact(artifactId, edition)) {
    return HOTA_SLOTS.get(artifactId) ?? null;
  }
  return CLASSIC_SLOT_BY_ID.get(artifactId) ?? null;
}

/**
 * Slots a combination artifact takes besides its own, by kind: one of each named kind, both
 * rings for 'ring' × 2, and that many misc slots. The game keeps the artifact in its own slot
 * only and counts the others per kind.
 */
type Locks = Partial<Record<WornSlotKind, number>>;

const CLASSIC_COMBINATIONS: ReadonlyMap<number, Locks> = new Map<number, Locks>([
  [129, { head: 1, neck: 1, torso: 1, shield: 1, feet: 1 }], // Angelic Alliance
  [130, { neck: 1, feet: 1 }], // Cloak of the Undead King
  [131, { ring: 2 }], // Elixir of Life
  [132, { head: 1, weapon: 1, shield: 1 }], // Armor of the Damned
  [133, { misc: 4 }], // Statue of Legion
  [134, { head: 1, neck: 1, weapon: 1, shield: 1, ring: 2, feet: 1, shoulders: 1 }], // Power of the Dragon Father
  [135, { head: 1, torso: 1, shield: 1 }], // Titan's Thunder
  [136, { neck: 1 }], // Admiral's Hat
  [137, { misc: 2 }], // Bow of the Sharpshooter
  [138, { misc: 2 }], // Wizard's Well
  [139, { neck: 1, shoulders: 1 }], // Ring of the Magi
  [140, { misc: 4 }], // Cornucopia
]);

const HOTA_COMBINATIONS: ReadonlyMap<number, Locks> = new Map<number, Locks>([
  [141, { neck: 1, ring: 1 }], // Diplomat's Cloak
  [142, { feet: 1, shoulders: 1 }], // Pendant of Reflection
  [143, { head: 1, torso: 1, shield: 1 }], // Ironfist of the Ogre
  [160, { misc: 2 }], // Golden Goose
]);

/** The slots a combination artifact takes besides its own, or undefined for a plain one. */
export function combinationLocks(artifactId: number, edition: Edition): Locks | undefined {
  return isHotaArtifact(artifactId, edition)
    ? HOTA_COMBINATIONS.get(artifactId)
    : artifactId <= 140
      ? CLASSIC_COMBINATIONS.get(artifactId)
      : undefined;
}
