import { afterEach, describe, expect, it } from 'vitest';
import { LOCALES, setLocale } from '../src/app/preferences.svelte';
import { ARTIFACTS } from '../src/data/artifacts';
import { CREATURES, TOWNS } from '../src/data/creatures';
import { EDITIONS, EDITION_RULES, isAvailableIn } from '../src/data/editions';
import { LEVEL_EXPERIENCE, MAX_LEVEL } from '../src/data/experience';
import { HERO_CLASSES } from '../src/data/heroClasses';
import { HERO_NAMES, type GameLanguage } from '../src/data/heroNames';
import { SECONDARY_SKILL_COUNT, SKILL_LEVELS } from '../src/data/skills';
import { SPELL_SCHOOLS, SPELLS, isInSchool } from '../src/data/spells';
import {
  artifactEffect,
  creatureDescription,
  creatureName,
  gameDictionaries,
} from '../src/i18n/game.svelte';

const ids = (list: readonly { id: number }[]): number[] => list.map((item) => item.id);
const range = (count: number): number[] => Array.from({ length: count }, (_, index) => index);

describe('reference data', () => {
  it('numbers every list without gaps, as stored in saves', () => {
    expect(ids(CREATURES)).toEqual(range(173));
    expect(ids(ARTIFACTS)).toEqual(range(144));
    expect(ids(SPELLS)).toEqual(range(70));
    expect(ids(HERO_CLASSES)).toEqual(range(18));
    expect(SECONDARY_SKILL_COUNT).toBe(28);
  });

  it('marks exactly the ids the game never filled', () => {
    expect(
      CREATURES.filter((creature) => creature.kind === 'placeholder').map((c) => c.id),
    ).toEqual([122, 124, 126, 128, 149]);
  });

  it('has 14 creatures in every town: seven levels, plain and upgraded', () => {
    for (const town of TOWNS.filter((candidate) => candidate !== 'neutral')) {
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

  it.each(EDITIONS)('the %s limits match what each item was introduced in', (edition) => {
    const { maxCreatureId, maxArtifactId } = EDITION_RULES[edition];
    for (const creature of CREATURES) {
      expect(isAvailableIn(creature.introducedIn, edition), `creature ${creature.id}`).toBe(
        creature.id <= maxCreatureId,
      );
    }
    for (const artifact of ARTIFACTS) {
      expect(isAvailableIn(artifact.introducedIn, edition), `artifact ${artifact.id}`).toBe(
        artifact.id <= maxArtifactId,
      );
    }
  });

  it("keeps Titan's Lightning Bolt and the two new classes out of the oldest editions", () => {
    expect(isAvailableIn(SPELLS[57]!.introducedIn, 'armageddonsBlade')).toBe(false);
    expect(isAvailableIn(SPELLS[57]!.introducedIn, 'shadowOfDeath')).toBe(true);
    expect(
      HERO_CLASSES.filter((c) => !isAvailableIn(c.introducedIn, 'restorationOfErathia')).map(
        (c) => c.id,
      ),
    ).toEqual([16, 17]);
  });

  it('flags the spell book, the spell scroll and the catapult as not recommended', () => {
    expect(ARTIFACTS.filter((artifact) => artifact.notRecommended).map((a) => a.id)).toEqual([
      0, 1, 3,
    ]);
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
    expect(names).toHaveLength(153);
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
    for (const skill of range(SECONDARY_SKILL_COUNT)) expect(texts[`skill.${skill}`]).toBeTruthy();
    for (const level of SKILL_LEVELS) expect(texts[`skillLevel.${level}`]).toBeTruthy();
    for (const edition of EDITIONS) expect(texts[`edition.${edition}`]).toBeTruthy();
    for (const artifact of ARTIFACTS) {
      expect(texts[`artifact.${artifact.id}`]).toBeTruthy();
      expect(artifactEffect(artifact.id) === undefined).toBe(Boolean(artifact.notRecommended));
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
    expect(creatureName(13)).toBe('Archangel');
    expect(creatureDescription(archangel)).toBe('Castle · level 7, upgraded');
    setLocale('ru');
    expect(creatureName(13)).toBe('Архангел');
    expect(creatureDescription(archangel)).toBe('Замок · 7 уровень, улучшенный');
    expect(creatureDescription(CREATURES[122]!)).toBe(
      'New World Computing забыли вписать его в игру',
    );
  });
});
