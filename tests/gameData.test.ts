import { afterEach, describe, expect, it } from 'vitest';
import { LOCALES, setLocale } from '../src/app/preferences.svelte';
import { ARTIFACTS, ARTIFACT_CATEGORIES, HOTA_ARTIFACTS, artifactsOf } from '../src/data/artifacts';
import { CREATURES, HOTA_CREATURES, TOWNS, creaturesOf } from '../src/data/creatures';
import { EDITIONS, isAvailableIn } from '../src/data/editions';
import { LEVEL_EXPERIENCE, MAX_LEVEL } from '../src/data/experience';
import { HERO_CLASSES } from '../src/data/heroClasses';
import { HERO_NAMES, type GameLanguage } from '../src/data/heroNames';
import { SECONDARY_SKILLS, SKILL_LEVELS } from '../src/data/skills';
import { SPELL_SCHOOLS, SPELLS, isInSchool } from '../src/data/spells';
import {
  artifactEffect,
  creatureDescription,
  creatureName,
  gameDictionaries,
} from '../src/i18n/game.svelte';

/** Towns of the classic games, each with fourteen creatures. */
const CLASSIC_TOWNS = TOWNS.filter(
  (town) => !['cove', 'factory', 'bulwark', 'neutral'].includes(town),
);

const ids = (list: readonly { id: number }[]): number[] => list.map((item) => item.id);
const range = (count: number): number[] => Array.from({ length: count }, (_, index) => index);

describe('reference data', () => {
  it('numbers every list without gaps, as stored in saves', () => {
    expect(ids(CREATURES)).toEqual(range(173));
    expect(ids(ARTIFACTS)).toEqual(range(144));
    expect(ids(SPELLS)).toEqual(range(70));
    expect(ids(HERO_CLASSES)).toEqual(range(24));
    expect(ids(SECONDARY_SKILLS)).toEqual(range(30));
    expect(
      SECONDARY_SKILLS.filter((skill) => skill.introducedIn === 'hornOfTheAbyss').map((s) => s.id),
    ).toEqual([28, 29]);
  });

  it('marks exactly the ids the game never filled', () => {
    expect(
      CREATURES.filter((creature) => creature.kind === 'placeholder').map((c) => c.id),
    ).toEqual([122, 124, 126, 128, 149]);
  });

  it('has 14 creatures in every town: seven levels, plain and upgraded', () => {
    for (const town of CLASSIC_TOWNS) {
      const townCreatures = CREATURES.filter((creature) => creature.town === town);
      const slots = townCreatures.map((c) => `${c.level ?? 0}${c.upgraded ? '+' : ''}`).sort();
      expect(slots, town).toEqual([
        '1',
        '1+',
        '2',
        '2+',
        '3',
        '3+',
        '4',
        '4+',
        '5',
        '5+',
        '6',
        '6+',
        '7',
        '7+',
      ]);
    }
  });

  it('has the Horn of the Abyss towns: the Cove with two level 3 upgrades, the Factory with two level 7 lines', () => {
    const slots = (town: string): string[] =>
      [...HOTA_CREATURES.values()]
        .filter((creature) => creature.town === town)
        .map((c) => `${c.level}${c.upgraded ? '+' : ''}`)
        .sort();
    const sevenLevels = [
      '1',
      '1+',
      '2',
      '2+',
      '3',
      '3+',
      '4',
      '4+',
      '5',
      '5+',
      '6',
      '6+',
      '7',
      '7+',
    ];
    expect(slots('bulwark')).toEqual(sevenLevels);
    expect(slots('cove')).toEqual([...sevenLevels, '3+'].sort());
    expect(slots('factory')).toEqual([...sevenLevels, '7', '7+'].sort());
    expect(HOTA_CREATURES.get(138)?.town).toBe('factory');
    expect(CREATURES[138]?.town).toBe('neutral');
    // No ids of their own: 145–150 and 152 in the creatures, 144 and 145 in the artifacts.
    // The town lines after the classic ids: the Sea Dog follows the Corsair.
    expect(creaturesOf('hornOfTheAbyss').map((c) => c.id)).toEqual([
      ...range(145),
      ...range(6).map((index) => 153 + index),
      151,
      ...range(41).map((index) => 159 + index),
    ]);
    expect(artifactsOf('hornOfTheAbyss').map((a) => a.id)).toEqual([
      ...range(144),
      ...range(20).map((index) => 146 + index),
    ]);
  });

  it("keeps Titan's Lightning Bolt and the newer classes out of the oldest editions", () => {
    expect(isAvailableIn(SPELLS[57]!.introducedIn, 'armageddonsBlade')).toBe(false);
    expect(isAvailableIn(SPELLS[57]!.introducedIn, 'shadowOfDeath')).toBe(true);
    expect(
      HERO_CLASSES.filter((c) => !isAvailableIn(c.introducedIn, 'restorationOfErathia')).map(
        (c) => c.id,
      ),
    ).toEqual([16, 17, 18, 19, 20, 21, 22, 23]);
    expect(
      HERO_CLASSES.filter((c) => !isAvailableIn(c.introducedIn, 'shadowOfDeath')).map((c) => c.id),
    ).toEqual([18, 19, 20, 21, 22, 23]);
  });

  it('marks the spell book, the spell scroll and the catapult as unused', () => {
    expect(ARTIFACTS.filter((artifact) => artifact.unused).map((a) => a.id)).toEqual([0, 1, 3]);
  });

  it('puts every artifact but the unused ones into a category, and every category is used', () => {
    for (const artifact of ARTIFACTS) {
      expect(artifact.category === undefined).toBe(Boolean(artifact.unused));
    }
    const all = [...ARTIFACTS, ...HOTA_ARTIFACTS.values()];
    for (const artifact of HOTA_ARTIFACTS.values()) expect(artifact.category).toBeDefined();
    for (const category of ARTIFACT_CATEGORIES) {
      expect(all.some((artifact) => artifact.category === category)).toBe(true);
    }
  });

  it('gives every town two hero classes, might then magic', () => {
    expect(HERO_CLASSES[0]!.town).toBe('castle');
    expect(HERO_CLASSES[9]!.town).toBe('necropolis');
    expect(HERO_CLASSES[17]!.town).toBe('conflux');
    expect(HERO_CLASSES.slice(18).map((heroClass) => heroClass.town)).toEqual([
      'cove',
      'cove',
      'factory',
      'factory',
      'bulwark',
      'bulwark',
    ]);
    for (const town of TOWNS.filter((town) => town !== 'neutral')) {
      expect(HERO_CLASSES.filter((heroClass) => heroClass.town === town)).toHaveLength(2);
    }
  });

  it('has an increasing experience table for levels 1–75', () => {
    expect(MAX_LEVEL).toBe(75);
    expect(LEVEL_EXPERIENCE[0]).toBe(0);
    for (let level = 1; level < MAX_LEVEL; level += 1) {
      expect(LEVEL_EXPERIENCE[level]!).toBeGreaterThan(LEVEL_EXPERIENCE[level - 1]!);
    }
  });

  it.each(Object.keys(HERO_NAMES) as GameLanguage[])('has unique %s hero names', (language) => {
    const names = HERO_NAMES[language];
    // 153 of the 2.05 editor, plus names found in real saves (Ryland and Drakon from SoD,
    // the HD Edition, Complete edition and Horn of the Abyss translations in Russian), Buka's
    // Russian spellings and the Horn of the Abyss heroes, its 16 campaign heroes included.
    expect(names).toHaveLength({ english: 231, russian: 317 }[language]);
    expect(new Set(names).size).toBe(names.length);
    expect(names.every((name) => name.trim() === name && name !== '')).toBe(true);
  });
});

describe('spells', () => {
  it('lists every spell once, in save order', () => {
    expect(SPELLS.map((spell) => spell.id)).toEqual(Array.from({ length: 70 }, (_, id) => id));
  });

  it('puts only Magic Arrow and Visions in all four schools', () => {
    expect(SPELLS.filter((spell) => spell.school === 'all').map((spell) => spell.id)).toEqual([
      2, 15,
    ]);
    for (const school of SPELL_SCHOOLS) {
      expect(isInSchool(SPELLS[15]!, school)).toBe(true);
    }
  });

  it('matches the game for a few well-known spells', () => {
    const fact = (id: number) => [SPELLS[id]!.school, SPELLS[id]!.level, SPELLS[id]!.purpose];
    expect(fact(21)).toEqual(['fire', 3, 'damage']); // Fireball
    expect(fact(9)).toEqual(['earth', 4, 'adventure']); // Town Portal
    expect(fact(48)).toEqual(['water', 4, 'buff']); // Prayer
    expect(fact(69)).toEqual(['air', 5, 'summoning']); // Summon Air Elemental
  });
});

describe('game dictionaries', () => {
  afterEach(() => setLocale('en'));

  it.each(LOCALES)('%s has the same keys as English', (locale) => {
    expect(Object.keys(gameDictionaries[locale]).sort()).toEqual(
      Object.keys(gameDictionaries.en).sort(),
    );
  });

  it.each(LOCALES)('%s names every item and describes every recommended artifact', (locale) => {
    setLocale(locale);
    const texts: Record<string, string> = gameDictionaries[locale];
    for (const creature of CREATURES) expect(texts[`creature.${creature.id}`]).toBeTruthy();
    for (const spell of SPELLS) expect(texts[`spell.${spell.id}`]).toBeTruthy();
    for (const spell of SPELLS) expect(texts[`spellEffect.${spell.id}`]).toBeTruthy();
    for (const heroClass of HERO_CLASSES) expect(texts[`heroClass.${heroClass.id}`]).toBeTruthy();
    for (const { id: skill } of SECONDARY_SKILLS) expect(texts[`skill.${skill}`]).toBeTruthy();
    for (const level of SKILL_LEVELS) expect(texts[`skillLevel.${level}`]).toBeTruthy();
    for (const edition of EDITIONS) expect(texts[`edition.${edition}`]).toBeTruthy();
    for (const artifact of ARTIFACTS) {
      expect(texts[`artifact.${artifact.id}`]).toBeTruthy();
      expect(artifactEffect(artifact.id, 'inTheWakeOfGods') === undefined).toBe(
        Boolean(artifact.unused),
      );
    }
    for (const id of HOTA_CREATURES.keys()) expect(texts[`creature.hota.${id}`]).toBeTruthy();
    for (const id of HOTA_ARTIFACTS.keys()) {
      expect(texts[`artifact.hota.${id}`]).toBeTruthy();
      expect(artifactEffect(id, 'hornOfTheAbyss')).toBeTruthy();
    }
  });

  it.each(LOCALES)('%s uses no leftover abbreviations in artifact effects', (locale) => {
    const effects = Object.entries(gameDictionaries[locale]).filter(([key]) =>
      key.startsWith('artifactEffect.'),
    );
    for (const [key, effect] of effects) {
      expect(effect, key).not.toMatch(/ {2}|\w\+\d|Advan|Basic-|Exp-|маг\.|ход\.|!!!/);
    }
  });

  it('describes creatures in the interface language', () => {
    const archangel = CREATURES[13]!;
    expect(creatureName(13, 'shadowOfDeath')).toBe('Archangel');
    expect(creatureName(151, 'inTheWakeOfGods')).not.toBe('Sea Dog');
    expect(creatureName(151, 'hornOfTheAbyss')).toBe('Sea Dog');
    expect(creatureName(138, 'hornOfTheAbyss')).toBe('Halfling');
    expect(creatureDescription(archangel)).toBe('Castle · level 7, upgraded');
    setLocale('ru');
    expect(creatureName(13, 'shadowOfDeath')).toBe('Архангел');
    expect(creatureName(138, 'shadowOfDeath')).toBe('Хоббит');
    expect(creatureName(138, 'hornOfTheAbyss')).toBe('Полурослик');
    expect(creatureDescription(archangel)).toBe('Замок · 7 уровень, улучшенный');
    expect(creatureDescription(CREATURES[122]!)).toBe(
      'New World Computing забыли вписать его в игру',
    );
  });
});
