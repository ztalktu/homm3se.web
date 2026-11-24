import { afterEach, describe, expect, it, vi } from 'vitest';
import { factionBuildings, type FactionBuildings } from '../src/data/buildings';
import { HOTA_CREATURES } from '../src/data/creatures';
import { EQUIPMENT_SLOTS } from '../src/data/equipment';
import { HERO_CLASSES } from '../src/data/heroClasses';
import { GUILD_SPELL_CHANCES, SPELLS } from '../src/data/spells';
import type { Hero } from '../src/core/hero';
import {
  applyHeroPreset,
  HERO_ATTRIBUTES,
  heroPresetData,
  townPresetBuildings,
  townPresetGarrison,
  townPresetGuild,
  type HeroPresetChoice,
  type PresetTarget,
} from '../src/core/presets';
import { maxLevel } from '../src/core/rules';

const SOD: PresetTarget = { from: 'shadowOfDeath', to: 'shadowOfDeath', limits: {} };

function hero(overrides: Partial<Hero> = {}): Hero {
  return {
    name: 'Gelu',
    classId: 2,
    level: 5,
    experience: 3500,
    attack: 2,
    defense: 2,
    spellPower: 1,
    knowledge: 1,
    mana: 10,
    movementPoints: 1500,
    maxMovementPoints: 1500,
    troops: [{ creatureId: 0, count: 10 }, null, null, null, null, null, null],
    secondarySkills: [{ skillId: 1, level: 1 }],
    spells: [15],
    hasSpellBook: false,
    equipment: Array.from({ length: EQUIPMENT_SLOTS.length }, () => null),
    backpack: [7],
    ...overrides,
  };
}

const nothing: HeroPresetChoice = { attributes: [], sections: [], backpack: 'add', spells: 'add' };

describe('hero presets', () => {
  it('keeps only the chosen attributes and sections', () => {
    const data = heroPresetData(hero(), ['level', 'attack'], ['skills']);
    expect(data).toEqual({
      attributes: { level: 5, attack: 2 },
      skills: [{ skillId: 1, level: 1 }],
    });
  });

  it('loads the chosen attributes only, within the limits of the target edition', () => {
    const source = hero({ name: 'Sandro', level: 999, attack: 40 });
    const data = heroPresetData(source, HERO_ATTRIBUTES, []);
    const { hero: loaded } = applyHeroPreset(
      hero(),
      data,
      { ...nothing, attributes: ['level', 'attack'] },
      { ...SOD, to: 'restorationOfErathia' },
    );
    expect(loaded.name).toBe('Gelu');
    expect(loaded.level).toBe(maxLevel('restorationOfErathia'));
    expect(loaded.attack).toBe(40);
  });

  it('skips a class the target edition does not have', () => {
    const hotaClass = HERO_CLASSES.find((heroClass) => heroClass.introducedIn === 'hornOfTheAbyss');
    const data = heroPresetData(hero({ classId: hotaClass!.id }), ['classId'], []);
    const result = applyHeroPreset(hero(), data, { ...nothing, attributes: ['classId'] }, SOD);
    expect(result.hero.classId).toBe(2);
    expect(result.skipped).toEqual([{ kind: 'class', id: hotaClass!.id }]);
  });

  it('replaces the army slot by slot and keeps a slot whose creature does not fit', () => {
    const hotaId = [...HOTA_CREATURES.keys()].find((id) => id > 144)!;
    const data = {
      troops: [
        null,
        { creatureId: 5, count: 3 },
        { creatureId: hotaId, count: 4 },
        null,
        null,
        null,
        null,
      ],
    };
    const current = hero({
      troops: [
        { creatureId: 0, count: 10 },
        null,
        { creatureId: 1, count: 2 },
        null,
        null,
        null,
        null,
      ],
    });
    const result = applyHeroPreset(
      current,
      data,
      { ...nothing, sections: ['troops'] },
      { ...SOD, from: 'hornOfTheAbyss' },
    );
    expect(result.hero.troops.slice(0, 3)).toEqual([
      null,
      { creatureId: 5, count: 3 },
      { creatureId: 1, count: 2 },
    ]);
    expect(result.skipped).toEqual([{ kind: 'creature', id: hotaId }]);
  });

  it('does not take an id of another edition that means something else there', () => {
    // A Horn of the Abyss creature id is an In the Wake of Gods one in a WoG save.
    const hotaId = [...HOTA_CREATURES.keys()].find((id) => id > 144)!;
    const data = { troops: [{ creatureId: hotaId, count: 1 }] };
    const result = applyHeroPreset(
      hero(),
      data,
      { ...nothing, sections: ['troops'] },
      { from: 'hornOfTheAbyss', to: 'inTheWakeOfGods', limits: {} },
    );
    expect(result.skipped).toEqual([{ kind: 'creature', id: hotaId }]);
  });

  it('replaces the skills without doubles and skills the edition lacks', () => {
    const data = {
      skills: [
        { skillId: 7, level: 3 as const },
        { skillId: 28, level: 1 as const },
        { skillId: 7, level: 1 as const },
      ],
    };
    const result = applyHeroPreset(hero(), data, { ...nothing, sections: ['skills'] }, SOD);
    expect(result.hero.secondarySkills).toEqual([{ skillId: 7, level: 3 }]);
    expect(result.skipped).toEqual([{ kind: 'skill', id: 28 }]);
  });

  it('adds to the backpack or replaces it, never past 64 artifacts', () => {
    const data = { backpack: [8, 9] };
    const add = applyHeroPreset(hero(), data, { ...nothing, sections: ['backpack'] }, SOD);
    expect(add.hero.backpack).toEqual([7, 8, 9]);
    const replace = applyHeroPreset(
      hero(),
      data,
      { ...nothing, sections: ['backpack'], backpack: 'replace' },
      SOD,
    );
    expect(replace.hero.backpack).toEqual([8, 9]);
    const full = applyHeroPreset(
      hero({ backpack: Array.from({ length: 63 }, () => 7) }),
      data,
      { ...nothing, sections: ['backpack'] },
      SOD,
    );
    expect(full.hero.backpack).toHaveLength(64);
  });

  it('adds or replaces spells, gives the book but never takes it', () => {
    const titansBolt = SPELLS.findIndex((spell) => spell.introducedIn !== 'restorationOfErathia');
    const data = { spells: { spells: [0, titansBolt], hasSpellBook: true } };
    const target = { ...SOD, to: 'restorationOfErathia' as const };
    const add = applyHeroPreset(hero(), data, { ...nothing, sections: ['spells'] }, target);
    expect(add.hero.spells).toEqual([0, 15]);
    expect(add.hero.hasSpellBook).toBe(true);
    expect(add.skipped).toEqual([{ kind: 'spell', id: titansBolt }]);

    const noBook = { spells: { spells: [0], hasSpellBook: false } };
    const replace = applyHeroPreset(
      hero({ hasSpellBook: true }),
      noBook,
      { ...nothing, sections: ['spells'], spells: 'replace' },
      SOD,
    );
    expect(replace.hero.spells).toEqual([0]);
    expect(replace.hero.hasSpellBook).toBe(true);
  });

  it('replaces the equipment and returns what came off', () => {
    const worn = (slots: Record<number, number>): (number | null)[] =>
      Array.from({ length: EQUIPMENT_SLOTS.length }, (_, slot) => slots[slot] ?? null);
    // Helm of the Alabaster Unicorn (head), Centaur's Axe (right hand), Ballista.
    const current = hero({ equipment: worn({ 0: 19, 3: 7 }) });
    const data = { equipment: worn({ 0: 20, 13: 4 }) };
    const result = applyHeroPreset(current, data, { ...nothing, sections: ['equipment'] }, SOD);
    expect(result.hero.equipment).toEqual(worn({ 0: 20, 13: 4 }));
    expect(result.takenOff).toEqual([19, 7]);
  });

  it('skips the fifth misc slot for a save that has none', () => {
    const data = { equipment: Array.from({ length: 19 }, (_, slot) => (slot === 18 ? 46 : null)) };
    const current = hero({ equipment: Array.from({ length: 18 }, () => null) });
    const result = applyHeroPreset(current, data, { ...nothing, sections: ['equipment'] }, SOD);
    expect(result.hero.equipment).toHaveLength(18);
    expect(result.skipped).toEqual([{ kind: 'artifact', id: 46 }]);
  });
});

describe('town presets', () => {
  const CASTLE = 0;
  const RAMPART = 1;
  const castle = factionBuildings(CASTLE, 'shadowOfDeath') as FactionBuildings;
  const rampart = factionBuildings(RAMPART, 'shadowOfDeath') as FactionBuildings;

  it('loads the buildings of the same faction with what they need', () => {
    // Town Hall (needs the Tavern), Griffin Tower (needs the Barracks, Blacksmith, Guardhouse).
    const result = townPresetBuildings(
      new Set([10]),
      [11, 32],
      { faction: CASTLE, buildings: castle },
      { faction: CASTLE, buildings: castle },
      new Set(),
    );
    expect([...result.buildings].sort((a, b) => a - b)).toEqual([5, 7, 10, 11, 16, 30, 32, 33]);
    expect(result.skipped).toEqual([]);
  });

  it('leaves out a locked Capitol', () => {
    const result = townPresetBuildings(
      new Set([10]),
      [13],
      { faction: CASTLE, buildings: castle },
      { faction: CASTLE, buildings: castle },
      new Set([13]),
    );
    expect(result.skipped).toEqual([13]);
    expect(result.buildings.has(13)).toBe(false);
  });

  it('brings only shared buildings from another faction and keeps the own special ones', () => {
    // Castle: Shipyard 6, Brotherhood of the Sword 22. Rampart: Mystic Pond 17 and Fountain of
    // Fortune 21 (needs 17) stay; the Dendroid horde 18 needs the level 2 dwelling 31, gone.
    const result = townPresetBuildings(
      new Set([10, 17, 21, 18, 30, 31, 7]),
      [5, 6, 7, 10, 11, 22, 30],
      { faction: CASTLE, buildings: castle },
      { faction: RAMPART, buildings: rampart },
      new Set(),
    );
    expect(result.skipped).toEqual([6, 22]);
    expect([...result.buildings].sort((a, b) => a - b)).toEqual([5, 7, 10, 11, 17, 21, 30]);
  });

  it('replaces the garrison slot by slot', () => {
    const result = townPresetGarrison(
      [{ creatureId: 0, count: 1 }, null, null, null, null, null, null],
      [null, { creatureId: 14, count: 5 }],
      SOD,
    );
    expect(result.garrison.slice(0, 2)).toEqual([null, { creatureId: 14, count: 5 }]);
  });

  it("keeps only the guild spells of the level that this faction's guild can have", () => {
    const never = SPELLS.find((spell) => (GUILD_SPELL_CHANCES[CASTLE]?.[spell.id] ?? 0) === 0)!;
    const level1 = SPELLS.find(
      (spell) => spell.level === 1 && (GUILD_SPELL_CHANCES[CASTLE]?.[spell.id] ?? 0) > 0,
    )!;
    const level2 = SPELLS.find((spell) => spell.level === 2)!;
    const rows: number[][] = [[level1.id, level2.id], [], [], [], []];
    rows[never.level - 1]!.push(never.id);
    const result = townPresetGuild(rows, CASTLE, 'shadowOfDeath');
    expect(result.guild[0]).toEqual([level1.id]);
    expect(result.skipped).toEqual(expect.arrayContaining([level2.id, never.id]));
  });
});

describe('stored presets', () => {
  afterEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  const load = async (): Promise<typeof import('../src/app/presets.svelte')> => {
    vi.resetModules();
    return import('../src/app/presets.svelte');
  };

  it('keeps presets newest first, replaces one by name and survives a reload', async () => {
    const store = await load();
    const preset = (name: string, savedAt: number) => ({
      name,
      savedAt,
      edition: 'shadowOfDeath' as const,
      data: { gold: savedAt },
    });
    store.savePreset('resources', preset('A', 1));
    store.savePreset('resources', preset('B', 2));
    store.savePreset('resources', preset('A', 3));
    expect(store.presetsOf('resources').map((known) => known.name)).toEqual(['A', 'B']);

    const reloaded = await load();
    expect(reloaded.presetsOf('resources').map((known) => known.data.gold)).toEqual([3, 2]);
    reloaded.deletePreset('resources', 'A');
    expect((await load()).presetsOf('resources').map((known) => known.name)).toEqual(['B']);
  });

  it('drops a broken preset and keeps the others', async () => {
    localStorage.setItem(
      'homm3se.presets.hero',
      JSON.stringify({
        version: 1,
        presets: [
          { name: 'Good', savedAt: 1, edition: 'shadowOfDeath', data: { backpack: [7] } },
          { name: 'Bad', savedAt: 1, edition: 'shadowOfDeath', data: { backpack: ['x'] } },
          { name: 'Old', savedAt: 1, edition: 'unknown', data: {} },
        ],
      }),
    );
    const store = await load();
    expect(store.presetsOf('hero').map((known) => known.name)).toEqual(['Good']);
  });
});
