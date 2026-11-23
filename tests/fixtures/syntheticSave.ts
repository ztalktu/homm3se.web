/**
 * Builds unpacked "saves" with hero records and treasuries at known places, byte by byte,
 * so the tests do not depend on the code they test. Layout offsets are repeated here on purpose.
 */

export interface RawHero {
  position: number;
  /** Name bytes as stored (already in the right code page). */
  name: number[];
  leadingSpace?: boolean;
  classId?: number;
  level?: number;
  experience?: number;
  primary?: [number, number, number, number];
  mana?: number;
  movementPoints?: number;
  maxMovementPoints?: number;
  /** [creatureId, count] per slot, null for empty. */
  troops?: ([number, number] | null)[];
  /** [skillId, level] in slot order. */
  skills?: [number, number][];
  spells?: number[];
  spellBook?: boolean;
  backpack?: number[];
  backpackOffset?: 357 | 365;
  /** Worn artifact ids by equipment slot, null or missing for an empty slot. */
  equipment?: (number | null)[];
}

export interface RawTreasury {
  goldPosition: number;
  /** wood, mercury, ore, sulfur, crystal, gems, gold */
  amounts: [number, number, number, number, number, number, number];
}

export function ascii(text: string): number[] {
  return [...text].map((character) => character.charCodeAt(0));
}

export function buildSave(
  size: number,
  heroes: RawHero[],
  treasuries: RawTreasury[] = [],
): Uint8Array {
  const bytes = new Uint8Array(size);
  const view = new DataView(bytes.buffer);
  const u32 = (offset: number, value: number): void => view.setUint32(offset, value >>> 0, true);

  for (const hero of heroes) {
    const p = hero.position;
    if (hero.leadingSpace) {
      bytes[p] = 0x20;
    }
    bytes.set(hero.name, p + (hero.leadingSpace ? 1 : 0));
    bytes[p - 158] = hero.classId ?? 0;
    bytes[p - 120] = hero.level ?? 1;
    u32(p - 130, hero.experience ?? 0);
    view.setUint16(p - 122, hero.mana ?? 10, true);
    u32(p - 134, hero.movementPoints ?? 20);
    u32(p - 138, hero.maxMovementPoints ?? 1500);
    const [attack, defense, power, knowledge] = hero.primary ?? [1, 1, 1, 1];
    bytes[p + 69] = attack;
    bytes[p + 70] = defense;
    bytes[p + 71] = power;
    bytes[p + 72] = knowledge;
    const troops = hero.troops ?? [[0, 10], null, null, null, null, null, null];
    for (let slot = 0; slot < 7; slot += 1) {
      const troop = troops[slot] ?? null;
      u32(p - 56 + slot * 4, troop ? troop[0] : 0xffffffff);
      u32(p - 28 + slot * 4, troop ? troop[1] : 0);
    }
    const skills = hero.skills ?? [];
    bytes[p - 126] = skills.length;
    skills.forEach(([skillId, level], index) => {
      bytes[p + 13 + skillId] = level;
      bytes[p + 41 + skillId] = index + 1;
    });
    for (const spell of hero.spells ?? []) {
      bytes[p + 73 + spell] = 1;
      bytes[p + 143 + spell] = 1;
    }
    const backpackOffset = hero.backpackOffset ?? 365;
    // 19 equipment slots of 8 bytes from +213, 18 when the backpack starts at +357.
    for (let slot = 0; slot < (backpackOffset - 213) / 8; slot += 1) {
      u32(p + 213 + slot * 8, hero.equipment?.[slot] ?? 0xffffffff);
      u32(p + 213 + slot * 8 + 4, 0xffffffff);
    }
    u32(p + 349, hero.spellBook === false ? 0xffffffff : 0);
    for (let slot = 0; slot < 64; slot += 1) {
      u32(p + backpackOffset + slot * 8, hero.backpack?.[slot] ?? 0xffffffff);
    }
  }

  for (const { goldPosition, amounts } of treasuries) {
    amounts.forEach((amount, index) => u32(goldPosition - 24 + index * 4, amount));
  }
  return bytes;
}

/**
 * A town record built byte by byte, with the offsets repeated on purpose: a counted name (The
 * Shadow of Death, 382 bytes besides the name) unless `fixedName` gives a name field length.
 */
export interface RawTown {
  owner?: number;
  faction?: number;
  xyz?: [number, number, number];
  name: string;
  garrison?: ([number, number] | null)[];
  built?: bigint;
  builtAll?: bigint;
  allowed?: bigint;
  guildSlots?: number[];
  guildSpells?: number[];
}

export function writeTowns(
  bytes: Uint8Array,
  start: number,
  towns: RawTown[],
  layout: { recordSize: number; fixedName?: number },
): number[] {
  const view = new DataView(bytes.buffer);
  const positions: number[] = [];
  let p = start;
  towns.forEach((town, number) => {
    positions.push(p);
    bytes[p + 8] = number;
    bytes[p + 9] = town.owner ?? 0xff;
    bytes[p + 12] = town.faction ?? 0;
    const [x, y, z] = town.xyz ?? [10, 20, 0];
    bytes[p + 13] = x;
    bytes[p + 14] = y;
    bytes[p + 15] = z;
    for (let slot = 0; slot < 7; slot += 1) {
      const troop = town.garrison?.[slot] ?? null;
      view.setUint32(p + 0x12 + slot * 4, troop ? troop[0] : 0xffffffff, true);
      view.setUint32(p + 0x2e + slot * 4, troop ? troop[1] : 0, true);
    }
    const name = [...town.name].map((character) => character.charCodeAt(0));
    let after: number;
    let next: number;
    if (layout.fixedName) {
      bytes.set(name, p + 0x4e);
      after = p + 0x4e + layout.fixedName;
      next = p + layout.recordSize;
    } else {
      view.setUint16(p + 0x4e, name.length, true);
      bytes.set(name, p + 0x50);
      after = p + 0x50 + name.length;
      next = p + layout.recordSize + name.length;
    }
    (town.guildSlots ?? [0, 0, 0, 0, 0]).forEach((slots, level) => {
      bytes[after + 0x54 + level] = slots;
    });
    view.setBigUint64(after + 0x59, town.built ?? 1n << 10n, true);
    view.setBigUint64(after + 0x61, town.builtAll ?? 1n << 10n, true);
    view.setBigUint64(after + 0x69, town.allowed ?? 0xfffffffffffn, true);
    (town.guildSpells ?? []).forEach((spell, index) => {
      view.setUint32(after + 0x71 + index * 4, spell, true);
    });
    p = next;
  });
  return positions;
}
