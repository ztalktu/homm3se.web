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
  /** [creatureId, count] per slot, null for empty. */
  troops?: ([number, number] | null)[];
  /** [skillId, level] in slot order. */
  skills?: [number, number][];
  spells?: number[];
  spellBook?: boolean;
  backpack?: number[];
  backpackOffset?: 357 | 365;
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
    bytes[p - 133] = hero.movementPoints ?? 20;
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
    u32(p + 349, hero.spellBook === false ? 0xffffffff : 0);
    const backpackOffset = hero.backpackOffset ?? 365;
    for (let slot = 0; slot < 64; slot += 1) {
      u32(p + backpackOffset + slot * 8, hero.backpack?.[slot] ?? 0xffffffff);
    }
  }

  for (const { goldPosition, amounts } of treasuries) {
    amounts.forEach((amount, index) => u32(goldPosition - 24 + index * 4, amount));
  }
  return bytes;
}
