import { describe, expect, it } from 'vitest';
import { writeTowns } from './fixtures/syntheticSave';
import { factionBuildings } from '../src/data/buildings';
import { GUILD_SPELL_CHANCES, SPELLS } from '../src/data/spells';
import { LAYOUTS } from '../src/core/layouts';
import { SaveBuffer } from '../src/core/saveBuffer';
import { findTowns, isHeroInTown, readHeroPlace, readTown, writeTown } from '../src/core/town';
import {
  buildAll,
  buildingMasks,
  fillGuild,
  guildCapacities,
  guildChoice,
  guildSpellsToWrite,
  minimumBuildings,
  prerequisites,
  randomGuildSpell,
  setBuilt,
  setSlotLevel,
  townBuildings,
} from '../src/core/townBuildings';

const BITS = (...ids: number[]): bigint => ids.reduce((mask, id) => mask | (1n << BigInt(id)), 0n);

describe('town records', () => {
  it('finds the numbered run of records and reads every field', () => {
    const bytes = new Uint8Array(6000);
    const positions = writeTowns(
      bytes,
      1000,
      [
        {
          owner: 0,
          faction: 8,
          xyz: [51, 128, 1],
          name: 'Cloudspire',
          garrison: [[118, 35], null, [127, 8]],
          built: BITS(5, 11, 30),
          builtAll: BITS(5, 10, 11, 30),
          guildSlots: [5, 0, 0, 0, 0],
          guildSpells: [15, 37, 27, 41, 53],
        },
        { name: 'Agony', faction: 4 },
      ],
      { recordSize: 382 },
    );
    const towns = findTowns(new SaveBuffer(bytes), LAYOUTS.shadowOfDeath.town);
    expect(towns.map((town) => town.position)).toEqual(positions);
    const [first, second] = towns;
    expect(first).toMatchObject({
      number: 0,
      owner: 'red',
      faction: 8,
      x: 51,
      y: 128,
      z: 1,
      name: 'Cloudspire',
      garrison: [
        { creatureId: 118, count: 35 },
        null,
        { creatureId: 127, count: 8 },
        null,
        null,
        null,
        null,
      ],
      built: BITS(5, 11, 30),
      builtAll: BITS(5, 10, 11, 30),
      guildSlots: [5, 0, 0, 0, 0],
    });
    expect(first!.guildSpells[0]).toEqual([15, 37, 27, 41, 53, 0]);
    expect(second).toMatchObject({ number: 1, owner: null, name: 'Agony' });
  });

  it('reads fixed name fields (Restoration of Erathia, HD Edition)', () => {
    for (const [layoutId, recordSize, fixedName] of [
      ['restorationOfErathia', 393, 13],
      ['hdEdition', 417, 37],
    ] as const) {
      const bytes = new Uint8Array(6000);
      writeTowns(bytes, 800, [{ name: 'Mystos' }, { name: 'Sanctum' }, { name: 'Moss' }], {
        recordSize,
        fixedName,
      });
      const towns = findTowns(new SaveBuffer(bytes), LAYOUTS[layoutId].town);
      expect(
        towns.map((town) => town.name),
        layoutId,
      ).toEqual(['Mystos', 'Sanctum', 'Moss']);
    }
  });

  it('ignores a lone record that does not continue the run', () => {
    const bytes = new Uint8Array(8000);
    writeTowns(bytes, 100, [{ name: 'Stray' }], { recordSize: 382 });
    const run = writeTowns(bytes, 3000, [{ name: 'One' }, { name: 'Two' }], { recordSize: 382 });
    const towns = findTowns(new SaveBuffer(bytes), LAYOUTS.shadowOfDeath.town);
    expect(towns.map((town) => town.position)).toEqual(run);
  });

  it('writes back the garrison, both masks and the guild, and nothing else', () => {
    const bytes = new Uint8Array(4000);
    const [position] = writeTowns(bytes, 500, [{ name: 'Town', allowed: BITS(1, 2, 3) }], {
      recordSize: 382,
    });
    const buffer = new SaveBuffer(bytes);
    const layout = LAYOUTS.shadowOfDeath.town;
    const town = readTown(buffer, position!, layout);
    const before = bytes.slice();
    writeTown(buffer, {
      ...town,
      garrison: [{ creatureId: 1, count: 5 }, null, null, null, null, null, null],
      built: BITS(11, 7),
      builtAll: BITS(10, 11, 7),
      guildSlots: [5, 0, 0, 0, 0],
      guildSpells: [[15, 37, 27, 41, 53, 0], [], [], [], []],
    });
    const reread = readTown(buffer, position!, layout);
    expect(reread.garrison[0]).toEqual({ creatureId: 1, count: 5 });
    expect(reread.built).toBe(BITS(11, 7));
    expect(reread.builtAll).toBe(BITS(10, 11, 7));
    expect(reread.allowed).toBe(BITS(1, 2, 3));
    expect(reread.guildSpells[0]).toEqual([15, 37, 27, 41, 53, 0]);
    writeTown(buffer, town);
    expect(bytes).toEqual(before);
  });

  it('places heroes standing on the town tile', () => {
    const bytes = new Uint8Array(2000);
    const view = new DataView(bytes.buffer);
    const hero = 1000;
    view.setUint16(hero - 195, 51, true);
    view.setUint16(hero - 193, 128, true);
    bytes[hero - 191] = 1;
    bytes[hero - 189] = 0;
    const place = readHeroPlace(new SaveBuffer(bytes), hero, LAYOUTS.shadowOfDeath.hero)!;
    expect(place).toEqual({ x: 51, y: 128, z: 1, onMap: false });
    const town = { x: 51, y: 128, z: 1 } as Parameters<typeof isHeroInTown>[1];
    expect(isHeroInTown(place, town)).toBe(true);
    expect(isHeroInTown({ ...place, z: 0 }, town)).toBe(false);
  });
});

describe('town buildings', () => {
  const castle = factionBuildings(0, 'shadowOfDeath')!;
  const conflux = factionBuildings(8, 'shadowOfDeath')!;
  const hall = [10, 11, 12, 13];
  const fort = [7, 8, 9];

  it('pulls in everything a building needs', () => {
    expect([...prerequisites(13, castle)].sort((a, b) => a - b)).toEqual([
      0, 5, 7, 8, 9, 11, 12, 14, 16,
    ]);
    const capitol = setSlotLevel(new Set([10]), hall, 3, castle);
    expect(capitol.added).toEqual([0, 5, 7, 8, 9, 11, 12, 13, 14, 16]);
    expect(capitol.removed).toEqual([]);
  });

  it('takes down what stands on a demolished building, but never the Village Hall', () => {
    const start = buildAll(new Set([10]), castle).buildings;
    const noFort = setSlotLevel(start, fort, -1, castle);
    expect(noFort.removed).toContain(7);
    expect(noFort.removed).toContain(30);
    expect(noFort.removed).toContain(13);
    expect(noFort.buildings.has(10)).toBe(true);
    expect(setSlotLevel(start, hall, -1, castle).buildings.has(10)).toBe(true);
  });

  it('builds everything but the excluded, keeps the Grail as it is, and resets to the minimum', () => {
    const all = buildAll(new Set([10]), castle, new Set([13]));
    expect(all.buildings.has(13)).toBe(false);
    expect(all.buildings.has(26)).toBe(false);
    expect(all.buildings.has(43)).toBe(true);
    const withGrail = setBuilt(all.buildings, 26, true, castle).buildings;
    expect(buildAll(withGrail, castle).buildings.has(26)).toBe(true);
    expect([...minimumBuildings(withGrail).buildings]).toEqual([10]);
  });

  it('turns the set into the two masks, keeping bits of no known building', () => {
    const town = {
      built: BITS(10, 23),
      builtAll: BITS(10),
    } as Parameters<typeof buildingMasks>[0];
    const have = setSlotLevel(new Set([10]), hall, 1, conflux).buildings;
    const masks = buildingMasks(town, have, conflux);
    // Town Hall replaces the Village Hall in the first mask; bit 23 is no Conflux building.
    expect(masks.built).toBe(BITS(5, 11, 23));
    expect(masks.builtAll).toBe(BITS(5, 10, 11));
    expect(buildingMasks(town, townBuildings(town as never, conflux), conflux)).toEqual({
      built: town.built,
      builtAll: town.builtAll,
    });
  });

  it('knows the Conflux horde Horn of the Abyss adds', () => {
    const hota = factionBuildings(8, 'hornOfTheAbyss')!;
    expect(hota.hordes[24]).toBe(7);
    expect(hota.hall.flat().some((chain) => chain.includes(24))).toBe(true);
    expect(conflux.hall.flat().some((chain) => chain.includes(24))).toBe(false);
  });
});

describe('mage guild', () => {
  it('gives each built level its slots, one more with the Tower library', () => {
    expect(guildCapacities(new Set([0, 1]), 0)).toEqual([5, 4, 0, 0, 0]);
    expect(guildCapacities(new Set([0, 1, 22]), 2)).toEqual([6, 5, 0, 0, 0]);
  });

  it('picks spells of the level by the faction weights, never one with no chance', () => {
    const conflux = 8;
    for (let step = 0; step < 50; step += 1) {
      const id = randomGuildSpell(5, conflux, new Set(), () => step / 50)!;
      const spell = SPELLS.find((candidate) => candidate.id === id)!;
      expect(spell.level).toBe(5);
      expect(GUILD_SPELL_CHANCES[conflux]![id]).toBeGreaterThan(0);
    }
    expect(randomGuildSpell(1, 0, new Set(SPELLS.map((spell) => spell.id)))).toBeUndefined();
  });

  it('fills slots a level gains, trims a level that shrinks and keeps a level that goes', () => {
    const built = fillGuild([[], [], [], [], []], [5, 0, 0, 0, 0], 0, () => 0.3);
    const level1 = built[0]!;
    expect(level1).toHaveLength(5);
    expect(new Set(level1).size).toBe(5);
    expect(level1.every((id) => SPELLS.find((spell) => spell.id === id)!.level === 1)).toBe(true);
    expect(fillGuild(built, [0, 0, 0, 0, 0], 0)[0]).toEqual(level1);
    expect(fillGuild(built, [3, 0, 0, 0, 0], 0)[0]).toEqual(level1.slice(0, 3));
  });

  it('writes the chosen spells into the first slots and keeps the rest of the file', () => {
    const town = {
      guildSlots: [2, 0, 0, 0, 0],
      guildSpells: [[15, 37, 27, 41, 53, 9], [1, 2, 3, 4, 5, 6], [], [], []],
    };
    expect(guildChoice(town)).toEqual([[15, 37], [], [], [], []]);
    expect(guildSpellsToWrite(town, [[46, 15, 31], [], [], [], []])[0]).toEqual([
      46, 15, 31, 41, 53, 9,
    ]);
  });
});
