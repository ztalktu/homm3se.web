import { describe, expect, it } from 'vitest';
import { hasHeroChanges, heroChanges, resourceChanges } from '../src/core/changes';
import type { Hero } from '../src/core/hero';
import type { ResourceAmounts } from '../src/core/resources';

const HERO: Hero = {
  name: 'Orrin',
  classId: 0,
  level: 5,
  experience: 4500,
  attack: 3,
  defense: 2,
  spellPower: 1,
  knowledge: 1,
  mana: 10,
  movementPoints: 1500,
  maxMovementPoints: 1500,
  troops: [{ creatureId: 0, count: 12 }, null, { creatureId: 2, count: 8 }, null, null, null, null],
  secondarySkills: [
    { skillId: 2, level: 1 },
    { skillId: 6, level: 1 },
  ],
  spells: [2, 9],
  hasSpellBook: true,
  backpack: [7, 33, 33],
};

const edit = (changes: Partial<Hero>): Hero => ({ ...structuredClone(HERO), ...changes });

describe('hero changes', () => {
  it('finds nothing in an unchanged hero', () => {
    expect(hasHeroChanges(heroChanges(HERO, edit({}), null))).toBe(false);
  });

  it('lists changed attributes and troops by slot', () => {
    const changes = heroChanges(
      HERO,
      edit({
        name: 'Sir Orrin',
        level: 12,
        troops: [
          { creatureId: 13, count: 20 },
          null,
          { creatureId: 2, count: 30 },
          null,
          null,
          null,
          null,
        ],
      }),
      null,
    );
    expect(changes.attributes).toEqual([
      { attribute: 'name', before: 'Orrin', after: 'Sir Orrin', saved: false },
      { attribute: 'level', before: 5, after: 12, saved: false },
    ]);
    expect(changes.troops.map((troop) => troop.slot)).toEqual([0, 2]);
  });

  it('compares skills by skill, not by slot', () => {
    // Leadership removed: Wisdom takes its slot, which is not a change of Leadership.
    const changes = heroChanges(
      HERO,
      edit({
        secondarySkills: [
          { skillId: 2, level: 3 },
          { skillId: 7, level: 3 },
        ],
      }),
      null,
    );
    expect(changes.skills).toEqual([
      { skillId: 2, before: 1, after: 3, saved: false },
      { skillId: 7, before: null, after: 3, saved: false },
      { skillId: 6, before: 1, after: null, saved: false },
    ]);
  });

  it('counts artifacts and spells in and out', () => {
    const changes = heroChanges(
      HERO,
      edit({ backpack: [7, 35], spells: [2, 6], hasSpellBook: false }),
      null,
    );
    expect(changes.artifacts).toEqual([
      { id: 35, added: true, count: 1, saved: false },
      { id: 33, added: false, count: 2, saved: false },
    ]);
    expect(changes.spells).toEqual([
      { id: 6, added: true, count: 1, saved: false },
      { id: 9, added: false, count: 1, saved: false },
    ]);
    expect(changes.spellBook).toEqual({ before: true, after: false, saved: false });
  });

  it('marks what the written file already holds', () => {
    const saved = edit({ level: 12, spells: [2, 9, 6] });
    const changes = heroChanges(HERO, edit({ level: 12, attack: 10, spells: [2, 9, 6, 8] }), saved);
    expect(changes.attributes.map(({ attribute, saved: done }) => [attribute, done])).toEqual([
      ['level', true],
      ['attack', false],
    ]);
    expect(changes.spells.map(({ id, saved: done }) => [id, done])).toEqual([
      [6, true],
      [8, false],
    ]);
  });
});

describe('resource changes', () => {
  const amounts: ResourceAmounts = {
    wood: 12,
    mercury: 0,
    ore: 9,
    sulfur: 0,
    crystal: 2,
    gems: 4,
    gold: 7340,
  };

  it('lists changed resources and which of them are written', () => {
    const current = { ...amounts, gold: 99999, gems: 0 };
    const saved = { ...amounts, gold: 99999 };
    expect(resourceChanges(amounts, current, saved)).toEqual([
      { resource: 'gems', before: 4, after: 0, saved: false },
      { resource: 'gold', before: 7340, after: 99999, saved: true },
    ]);
  });
});
