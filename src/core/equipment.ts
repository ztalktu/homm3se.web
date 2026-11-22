/**
 * Putting artifacts on a hero and taking them off. Combination artifacts take more slots than
 * their own: the game keeps such an artifact in its own slot only, leaves the others empty and
 * counts them per slot kind. Misc slots are taken from the end.
 */

import { isAvailableIn, type Edition } from '../data/editions';
import { artifactById, artifactsOf } from '../data/artifacts';
import {
  EQUIPMENT_SLOTS,
  SPELL_BOOK_SLOT,
  WAR_MACHINE_SLOTS,
  WORN_SLOT_KINDS,
  artifactSlotKind,
  combinationLocks,
  type SlotKind,
  type WornSlotKind,
} from '../data/equipment';

type Equipment = readonly (number | null)[];

export interface EquipmentEdit {
  equipment: (number | null)[];
  /** Artifacts that came off: the replaced one, then those in the slots that got taken. */
  removed: number[];
  /** The part of `removed` that came out of other slots than the one being changed. */
  displaced: number[];
}

/** Slots of a kind that the hero's save has, in slot order. */
function slotsOfKind(equipment: Equipment, kind: SlotKind): number[] {
  return EQUIPMENT_SLOTS.flatMap((slot, index) =>
    index < equipment.length && slot.kind === kind ? [index] : [],
  );
}

function isCombination(artifactId: number | null, edition: Edition): boolean {
  return artifactId !== null && combinationLocks(artifactId, edition) !== undefined;
}

/** Whether an artifact may be worn in a slot of an `edition` save. */
export function fitsSlot(artifactId: number, slot: number, edition: Edition): boolean {
  const artifact = artifactById(artifactId, edition);
  return (
    artifact !== undefined &&
    isAvailableIn(artifact.introducedIn, edition) &&
    slot !== SPELL_BOOK_SLOT &&
    EQUIPMENT_SLOTS[slot]?.kind === artifactSlotKind(artifactId, edition)
  );
}

/**
 * The slots taken by combination artifacts, each with the slot of the artifact that takes it.
 * Each combination artifact, in slot order, takes the last free slots of each kind it needs.
 */
export function equipmentLocks(equipment: Equipment, edition: Edition): Map<number, number> {
  const takenBy = new Map<number, number>();
  equipment.forEach((artifactId, owner) => {
    const locks = artifactId === null ? undefined : combinationLocks(artifactId, edition);
    if (!locks) {
      return;
    }
    for (const kind of WORN_SLOT_KINDS) {
      const free = slotsOfKind(equipment, kind).filter(
        (slot) => !isCombination(equipment[slot] ?? null, edition) && !takenBy.has(slot),
      );
      for (const slot of free.slice(Math.max(0, free.length - (locks[kind] ?? 0)))) {
        takenBy.set(slot, owner);
      }
    }
  });
  return takenBy;
}

/** How many slots of each kind (in WORN_SLOT_KINDS order) combination artifacts take. */
export function combinationCounters(equipment: Equipment, edition: Edition): number[] {
  return WORN_SLOT_KINDS.map((kind) =>
    equipment.reduce(
      (sum: number, artifactId) =>
        sum + (artifactId === null ? 0 : (combinationLocks(artifactId, edition)?.[kind] ?? 0)),
      0,
    ),
  );
}

/** Slot of a combination artifact other than the one in `keep` that stands in the way of `kind`. */
function combinationInTheWay(
  equipment: Equipment,
  kind: WornSlotKind,
  keep: number,
  edition: Edition,
): number {
  return equipment.findIndex((artifactId, slot) => {
    const locks = artifactId === null ? undefined : combinationLocks(artifactId, edition);
    return (
      slot !== keep &&
      locks !== undefined &&
      ((locks[kind] ?? 0) > 0 || EQUIPMENT_SLOTS[slot]?.kind === kind)
    );
  });
}

/**
 * Puts an artifact into a slot. What was there comes off, and so does everything in the slots a
 * combination artifact takes: plain artifacts, and other combination artifacts that leave too
 * few slots of a kind. A slot taken by a combination artifact is freed first.
 */
export function wearArtifact(
  equipment: Equipment,
  slot: number,
  artifactId: number,
  edition: Edition,
): EquipmentEdit {
  const next = [...equipment];
  const removed: number[] = [];
  const displaced: number[] = [];
  const takeOff = (index: number): void => {
    const current = next[index] ?? null;
    if (current !== null) {
      removed.push(current);
      if (index !== slot) {
        displaced.push(current);
      }
    }
    next[index] = null;
  };

  const owner = equipmentLocks(next, edition).get(slot);
  if (owner !== undefined) {
    takeOff(owner);
  }
  takeOff(slot);
  next[slot] = artifactId;

  // Other combination artifacts leave if a kind runs short of slots for all of them.
  for (;;) {
    const counters = combinationCounters(next, edition);
    const short = WORN_SLOT_KINDS.find((kind, index) => {
      const free = slotsOfKind(next, kind).filter(
        (other) => !isCombination(next[other] ?? null, edition),
      ).length;
      return (counters[index] ?? 0) > free;
    });
    const inTheWay = short === undefined ? -1 : combinationInTheWay(next, short, slot, edition);
    if (inTheWay < 0) {
      break;
    }
    takeOff(inTheWay);
  }

  for (const taken of equipmentLocks(next, edition).keys()) {
    takeOff(taken);
  }
  return { equipment: next, removed, displaced };
}

/** Takes the artifact off a slot; a combination artifact frees the slots it took. */
export function takeOffArtifact(equipment: Equipment, slot: number): EquipmentEdit {
  const artifactId = equipment[slot] ?? null;
  const next = [...equipment];
  next[slot] = null;
  return { equipment: next, removed: artifactId === null ? [] : [artifactId], displaced: [] };
}

/** The war machines of an `edition` save, each with its slot: the Cannon shares the Ballista's. */
export function warMachines(edition: Edition): { slot: number; key: string; artifactId: number }[] {
  return WAR_MACHINE_SLOTS.flatMap(({ index, key }) =>
    artifactsOf(edition)
      .filter((artifact) => fitsSlot(artifact.id, index, edition))
      .map((artifact) => ({ slot: index, key, artifactId: artifact.id })),
  );
}
