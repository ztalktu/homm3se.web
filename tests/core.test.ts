import { describe, expect, it } from 'vitest';
import { requiredEdition } from '../src/core/editionDetection';
import { experienceForLevel, levelForExperience } from '../src/core/experience';
import { compressGzip, decompressGzip, isGzip } from '../src/core/gzip';
import { InvalidHeroNameError, readHero, writeHero, type Hero } from '../src/core/hero';
import { findHero, findNextHero } from '../src/core/heroSearch';
import { findResources, readResources, writeResources } from '../src/core/resources';
import { artifactAllowed, creatureProblem, validateHero } from '../src/core/rules';
import { SaveBuffer } from '../src/core/saveBuffer';
import {
  NotASaveError,
  SaveGame,
  editedFileName,
  gameTypeFromFileName,
} from '../src/core/saveGame';
import { codePagesFor, decodeText, encodeText } from '../src/core/textEncoding';
import {
  detectSaveFormat,
  editionFromHeader,
  isEditingTested,
  minimumEditionFor,
} from '../src/core/saveFormat';
import { heroLayoutAt, LAYOUTS, layoutFor } from '../src/core/layouts';
import { ascii, buildSave } from './fixtures/syntheticSave';

const SOD = LAYOUTS.shadowOfDeath.hero;
const ROE = LAYOUTS.restorationOfErathia.hero;

const GELU = {
  position: 1000,
  name: ascii('Gelu'),
  classId: 2,
  level: 13,
  experience: 25_280,
  primary: [4, 3, 2, 1] as [number, number, number, number],
  mana: 300,
  movementPoints: 1745,
  maxMovementPoints: 1560,
  troops: [[26, 5], null, [13, 2], null, null, null, null] as ([number, number] | null)[],
  skills: [
    [7, 3],
    [1, 2],
  ] as [number, number][],
  spells: [0, 15, 57],
  backpack: [7, 45, 92],
};

describe('gzip', () => {
  it('round-trips data and recognizes the signature', async () => {
    const data = new TextEncoder().encode('Heroes of Might and Magic III');
    const packed = await compressGzip(data);
    expect(isGzip(packed)).toBe(true);
    expect(isGzip(data)).toBe(false);
    expect([...(await decompressGzip(packed))]).toEqual([...data]);
  });

  it('refuses files that are not gzip', async () => {
    await expect(SaveGame.open('notes.gm1', new Uint8Array([1, 2, 3]))).rejects.toBeInstanceOf(
      NotASaveError,
    );
  });

  it('opens, edits and packs a save', async () => {
    const original = buildSave(4000, [GELU]);
    const save = await SaveGame.open('dol.gm1', await compressGzip(original));
    expect(save.buffer.bytes).toEqual(original);
    expect(save.hasUnsavedChanges).toBe(false);
    save.edit((buffer) => buffer.writeU8(10, 42));
    expect(save.hasUnsavedChanges).toBe(true);
    const repacked = await decompressGzip(await save.pack());
    expect(repacked[10]).toBe(42);
  });
});

describe('save file names', () => {
  it('tells campaigns from scenarios', () => {
    expect(gameTypeFromFileName('Erathia.CGM')).toEqual({ kind: 'campaign' });
    expect(gameTypeFromFileName('dol.gm4')).toEqual({ kind: 'scenario', players: 4 });
    expect(gameTypeFromFileName('readme.txt')).toEqual({ kind: 'unknown' });
    expect(editedFileName('dol.gm1')).toBe('se_dol.gm1');
  });
});

describe('text encodings', () => {
  it('encodes Russian names in windows-1251 and English ones in windows-1252', () => {
    expect([...(encodeText('Джелу', 'windows-1251') ?? [])]).toEqual([
      0xc4, 0xe6, 0xe5, 0xeb, 0xf3,
    ]);
    expect(decodeText(new Uint8Array([0xc4, 0xe6, 0xe5, 0xeb, 0xf3]), 'windows-1251')).toBe(
      'Джелу',
    );
    expect(encodeText('Джелу', 'windows-1252')).toBeNull();
    expect(codePagesFor('Джелу')).toEqual(['windows-1251']);
    expect(codePagesFor('Gelu')).toEqual(['windows-1252', 'windows-1251']);
  });
});

describe('hero search', () => {
  it('skips name matches that are not hero records', () => {
    const bytes = buildSave(4000, [GELU]);
    bytes.set(ascii('Gelu'), 200);
    bytes[200 + 73] = 7; // impossible spell flag next to the fake hit
    const match = findHero(new SaveBuffer(bytes), 'Gelu');
    expect(match).toEqual({ position: 1000, codePage: 'windows-1252' });
  });

  it('starts the record at a leading space, as in crooked translations', () => {
    const bytes = buildSave(4000, [{ ...GELU, leadingSpace: true }]);
    expect(findHero(new SaveBuffer(bytes), 'Gelu')?.position).toBe(1000);
  });

  it('finds the next hero with the same name and then stops', () => {
    const buffer = new SaveBuffer(buildSave(6000, [GELU, { ...GELU, position: 3000 }]));
    const first = findHero(buffer, 'Gelu');
    const second = first && findNextHero(buffer, 'Gelu', first);
    expect(second?.position).toBe(3000);
    expect(second && findNextHero(buffer, 'Gelu', second)).toBeNull();
  });

  it('finds Russian names in windows-1251', () => {
    const name = [...(encodeText('Джелу', 'windows-1251') ?? [])];
    const buffer = new SaveBuffer(buildSave(4000, [{ ...GELU, name }]));
    expect(findHero(buffer, 'Джелу')).toEqual({ position: 1000, codePage: 'windows-1251' });
  });
});

describe('hero record', () => {
  const expected: Hero = {
    name: 'Gelu',
    classId: 2,
    level: 13,
    experience: 25_280,
    attack: 4,
    defense: 3,
    spellPower: 2,
    knowledge: 1,
    mana: 300,
    movementPoints: 1745,
    maxMovementPoints: 1560,
    troops: [
      { creatureId: 26, count: 5 },
      null,
      { creatureId: 13, count: 2 },
      null,
      null,
      null,
      null,
    ],
    secondarySkills: [
      { skillId: 7, level: 3 },
      { skillId: 1, level: 2 },
    ],
    spells: [0, 15, 57],
    hasSpellBook: true,
    backpack: [7, 45, 92],
  };

  it('reads every field, skills in slot order', () => {
    const buffer = new SaveBuffer(buildSave(4000, [GELU]));
    expect(readHero(buffer, 1000, SOD, 'windows-1252')).toEqual(expected);
  });

  it('uses the older backpack position for Erathia and Armageddon saves', () => {
    const buffer = new SaveBuffer(buildSave(4000, [{ ...GELU, backpackOffset: 357 }]));
    expect(readHero(buffer, 1000, ROE, 'windows-1252').backpack).toEqual([7, 45, 92]);
  });

  it('writes changes and reads them back unchanged', () => {
    const buffer = new SaveBuffer(buildSave(4000, [GELU]));
    const changed: Hero = {
      ...expected,
      name: 'Gelu Pumped',
      level: 30,
      experience: 496_685,
      attack: 99,
      mana: 999,
      movementPoints: 30_000,
      maxMovementPoints: 2_000,
      troops: [
        { creatureId: 132, count: 100 },
        null,
        null,
        null,
        null,
        null,
        { creatureId: 0, count: 1 },
      ],
      secondarySkills: [{ skillId: 22, level: 3 }],
      spells: [26, 69],
      hasSpellBook: false,
      backpack: [128, 129],
    };
    writeHero(buffer, 1000, SOD, 'windows-1252', changed);
    expect(readHero(buffer, 1000, SOD, 'windows-1252')).toEqual(changed);
  });

  it('refuses names that do not fit and leaves the save untouched', () => {
    const bytes = buildSave(4000, [GELU]);
    const before = bytes.slice();
    const buffer = new SaveBuffer(bytes);
    expect(() =>
      writeHero(buffer, 1000, SOD, 'windows-1252', {
        ...expected,
        name: 'A name far too long',
      }),
    ).toThrow(InvalidHeroNameError);
    expect(() =>
      writeHero(buffer, 1000, SOD, 'windows-1252', { ...expected, name: 'Джелу' }),
    ).toThrow(InvalidHeroNameError);
    expect(bytes).toEqual(before);
  });
});

describe('resources', () => {
  const treasury = {
    goldPosition: 2000,
    amounts: [20, 10, 20, 10, 10, 10, 7500] as [
      number,
      number,
      number,
      number,
      number,
      number,
      number,
    ],
  };

  it('finds the treasury by gold, skipping hits with impossible neighbours', () => {
    const bytes = buildSave(4000, [], [treasury]);
    new DataView(bytes.buffer).setUint32(500, 7500, true);
    new DataView(bytes.buffer).setUint32(500 - 24, 0xfffffff0, true);
    expect(findResources(new SaveBuffer(bytes), { gold: 7500 })).toBe(2000);
  });

  it('narrows the search with other resources', () => {
    const other = {
      goldPosition: 1000,
      amounts: [5, 0, 5, 0, 0, 0, 7500] as typeof treasury.amounts,
    };
    const buffer = new SaveBuffer(buildSave(4000, [], [other, treasury]));
    expect(findResources(buffer, { gold: 7500 })).toBe(1000);
    expect(findResources(buffer, { gold: 7500, also: { wood: 20 } })).toBe(2000);
    expect(findResources(buffer, { gold: 7500 }, 1001)).toBe(2000);
  });

  it('reads and writes all seven resources', () => {
    const buffer = new SaveBuffer(buildSave(4000, [], [treasury]));
    const amounts = {
      wood: 999,
      mercury: 1,
      ore: 999,
      sulfur: 2,
      crystal: 3,
      gems: 4,
      gold: 999_999_999,
    };
    writeResources(buffer, 2000, amounts);
    expect(readResources(buffer, 2000)).toEqual(amounts);
    expect(() => writeResources(buffer, 2000, { ...amounts, gold: 1_000_000_000 })).toThrow(
      RangeError,
    );
  });

  it('needs at least one gold to search', () => {
    expect(() => findResources(new SaveBuffer(new Uint8Array(100)), { gold: 0 })).toThrow(
      RangeError,
    );
  });
});

describe('experience', () => {
  it('converts between level and experience', () => {
    expect(levelForExperience(0)).toBe(1);
    expect(levelForExperience(999)).toBe(1);
    expect(levelForExperience(1000)).toBe(2);
    expect(levelForExperience(25_280)).toBe(13);
    expect(levelForExperience(2_000_000_000)).toBe(75);
    expect(experienceForLevel(13)).toBe(24_319);
    expect(experienceForLevel(0)).toBe(0);
    expect(experienceForLevel(99)).toBe(1_808_894_836);
  });
});

describe('edition detection', () => {
  const base = readHero(
    new SaveBuffer(buildSave(4000, [{ ...GELU, spells: [], backpack: [] }])),
    1000,
    SOD,
    'windows-1252',
  );

  it('keeps the edition when everything fits', () => {
    expect(requiredEdition(base, 'restorationOfErathia')).toBeNull();
  });

  it('raises the edition for newer classes, creatures and artifacts', () => {
    expect(requiredEdition({ ...base, classId: 16 }, 'restorationOfErathia')).toBe(
      'armageddonsBlade',
    );
    expect(
      requiredEdition(
        { ...base, troops: [{ creatureId: 150, count: 1 }, null, null, null, null, null, null] },
        'shadowOfDeath',
      ),
    ).toBe('inTheWakeOfGods');
    expect(requiredEdition({ ...base, backpack: [135] }, 'armageddonsBlade')).toBe('shadowOfDeath');
    expect(requiredEdition({ ...base, backpack: [135] }, 'heroesChronicles')).toBeNull();
  });
});

describe('rules', () => {
  const hero = readHero(
    new SaveBuffer(buildSave(4000, [{ ...GELU, spells: [] }])),
    1000,
    SOD,
    'windows-1252',
  );

  it('accepts a normal hero', () => {
    expect(validateHero(hero, 'shadowOfDeath')).toEqual([]);
  });

  it('reports a captain without an army, duplicate skills and edition problems', () => {
    const codes = validateHero(
      {
        ...hero,
        troops: [null, null, null, null, null, null, null],
        secondarySkills: [
          { skillId: 1, level: 1 },
          { skillId: 1, level: 2 },
        ],
        spells: [57],
        backpack: [1, 141],
      },
      'armageddonsBlade',
    ).map((problem) => problem.code);
    expect(codes).toEqual([
      'noTroops',
      'duplicateSkill',
      'artifactNotAllowed',
      'artifactNotAllowed',
      'spellNotInEdition',
    ]);
  });

  it('tells placeholders from creatures of a newer edition', () => {
    expect(creatureProblem(122, 'inTheWakeOfGods')).toBe('placeholder');
    expect(creatureProblem(150, 'shadowOfDeath')).toBe('edition');
    expect(creatureProblem(13, 'restorationOfErathia')).toBeNull();
    expect(artifactAllowed(0, 'restorationOfErathia')).toBe(true);
    expect(artifactAllowed(1, 'inTheWakeOfGods')).toBe(false);
  });
});

describe('save format', () => {
  it('keeps a half-set spell flag when the spell itself is not changed', () => {
    const bytes = buildSave(4000, [GELU]);
    bytes[1000 + 143 + 54] = 1; // only the second flag of Slow, as found in a real save
    const before = bytes.slice();
    const buffer = new SaveBuffer(bytes);
    const hero = readHero(buffer, 1000, SOD, 'windows-1252');
    expect(hero.spells).not.toContain(54);
    writeHero(buffer, 1000, SOD, 'windows-1252', hero);
    expect([...bytes]).toEqual([...before]);
  });

  it('picks the layout from the header version when it is known', () => {
    const header = (major: number, minor = 0): SaveBuffer => {
      const bytes = new Uint8Array(32);
      bytes.set([0x48, 0x33, 0x53, 0x56, 0x47]); // H3SVG
      new DataView(bytes.buffer).setUint32(8, major, true);
      new DataView(bytes.buffer).setUint32(12, minor, true);
      return new SaveBuffer(bytes);
    };
    expect(detectSaveFormat(header(0x2a)).kind).toBe('classic');
    expect(detectSaveFormat(header(0x12)).kind).toBe('hdEdition');
    expect(detectSaveFormat(header(0x2c)).kind).toBe('hornOfTheAbyss');
    expect(detectSaveFormat(new SaveBuffer(new Uint8Array(32))).kind).toBe('unknown');
    expect(layoutFor(detectSaveFormat(header(0x2a)), 'restorationOfErathia').id).toBe(
      'shadowOfDeath',
    );
    expect(layoutFor(detectSaveFormat(header(0x10)), 'shadowOfDeath').id).toBe(
      'restorationOfErathia',
    );
    expect(layoutFor(detectSaveFormat(header(0x12)), 'shadowOfDeath').id).toBe('hdEdition');
    expect(layoutFor({ kind: 'unknown' }, 'armageddonsBlade').hero.backpack).toBe(357);
    expect(layoutFor({ kind: 'unknown' }, 'hdEdition').hero.backpack).toBe(357);
    expect(layoutFor({ kind: 'unknown' }, 'inTheWakeOfGods').hero.backpack).toBe(365);
    expect(minimumEditionFor(detectSaveFormat(header(0x2a)))).toBe('shadowOfDeath');
    expect(minimumEditionFor(detectSaveFormat(header(0x2a, 2)))).toBe('shadowOfDeath');
    expect(minimumEditionFor(detectSaveFormat(header(0x12)))).toBe('hdEdition');
    expect(minimumEditionFor(detectSaveFormat(header(0x10)))).toBeNull();
    expect(minimumEditionFor({ kind: 'unknown' })).toBeNull();
  });

  it("recognises Armageddon's Blade by header 42/1", () => {
    const bytes = new Uint8Array(32);
    bytes.set(ascii('H3SVG'));
    new DataView(bytes.buffer).setUint32(8, 42, true);
    new DataView(bytes.buffer).setUint32(12, 1, true);
    const format = detectSaveFormat(new SaveBuffer(bytes));
    expect(format).toEqual({ kind: 'classic', major: 42, minor: 1 });
    expect(editionFromHeader(format)).toBe('armageddonsBlade');
    expect(minimumEditionFor(format)).toBe('armageddonsBlade');
    expect(layoutFor(format, 'shadowOfDeath').id).toBe('armageddonsBlade');
    expect(isEditingTested(format)).toBe(true);
  });

  it('recognises Heroes Chronicles by its longer signature', () => {
    const bytes = new Uint8Array(32);
    bytes.set(ascii('HCHRONSVG'));
    new DataView(bytes.buffer).setUint32(9, 42, true);
    new DataView(bytes.buffer).setUint32(13, 0, true);
    const format = detectSaveFormat(new SaveBuffer(bytes));
    expect(format).toEqual({ kind: 'heroesChronicles', major: 42, minor: 0 });
    expect(editionFromHeader(format)).toBe('heroesChronicles');
    expect(layoutFor(format, 'restorationOfErathia').id).toBe('shadowOfDeath');
    expect(isEditingTested(format)).toBe(true);
  });
});

describe('layouts', () => {
  it('differ only where the hero records of the editions differ', () => {
    const roe = LAYOUTS.restorationOfErathia.hero;
    const hd = LAYOUTS.hdEdition.hero;
    expect(hd).toEqual(roe);
    expect(LAYOUTS.armageddonsBlade.hero).toEqual({ ...roe, recordSize: null });
    expect(LAYOUTS.armageddonsBladeGog.hero).toEqual({ ...roe, recordSize: null, backpack: 365 });
    const differences = Object.keys(SOD).filter(
      (field) => SOD[field as keyof typeof SOD] !== roe[field as keyof typeof roe],
    );
    expect(differences.sort()).toEqual(
      ['backpack', 'combinationCounters', 'equipmentSlots', 'recordSize'].sort(),
    );
    expect(roe.backpack).toBe(357);
    expect(SOD.backpack).toBe(365);
  });
});

describe("Armageddon's Blade variants", () => {
  const AB_HEADER = { kind: 'classic', major: 42, minor: 1 } as const;

  it('reads the original variant with the backpack at +357', () => {
    const buffer = new SaveBuffer(buildSave(4000, [{ ...GELU, backpackOffset: 357 }]));
    const layout = heroLayoutAt(AB_HEADER, 'armageddonsBlade', buffer, 1000);
    expect(layout.backpack).toBe(357);
    expect(readHero(buffer, 1000, layout, 'windows-1252').backpack).toEqual([7, 45, 92]);
  });

  it('reads the newer variant when the eight bytes before its backpack are padding', () => {
    const bytes = buildSave(4000, [{ ...GELU, backpackOffset: 365 }]);
    bytes.fill(0, 1000 + 357, 1000 + 365);
    const buffer = new SaveBuffer(bytes);
    const layout = heroLayoutAt(AB_HEADER, 'armageddonsBlade', buffer, 1000);
    expect(layout.backpack).toBe(365);
    expect(readHero(buffer, 1000, layout, 'windows-1252').backpack).toEqual([7, 45, 92]);
  });

  it('keeps the other layouts as they are', () => {
    const buffer = new SaveBuffer(buildSave(4000, [GELU]));
    const sod = { kind: 'classic', major: 42, minor: 2 } as const;
    expect(heroLayoutAt(sod, 'shadowOfDeath', buffer, 1000)).toBe(SOD);
  });
});
