import { describe, expect, it } from 'vitest';
import { RESOURCES } from '../src/core/layouts';
import { RESOURCE_ART } from '../src/ui/components/resourceArt';
import { formatDateTime } from '../src/ui/format';
import { filterOptions, normalizeSearchText } from '../src/ui/logic/filterOptions';
import { placeTakenOff } from '../src/ui/logic/takenOff';
import {
  clamp,
  parseNumberText,
  sanitizeNumberText,
  stepNumber,
  HOLD,
  holdInterval,
  holdStep,
  roundStep,
} from '../src/ui/logic/numberInput';

describe('number input', () => {
  it('keeps digits only', () => {
    expect(sanitizeNumberText('12a3 4', false)).toBe('1234');
    expect(sanitizeNumberText('-15', false)).toBe('15');
  });

  it('keeps a leading minus when negative values are allowed', () => {
    expect(sanitizeNumberText('-1-5', true)).toBe('-15');
    expect(sanitizeNumberText('1-5', true)).toBe('15');
  });

  it('parses text, treating empty input as no value', () => {
    expect(parseNumberText('')).toBeNull();
    expect(parseNumberText('-')).toBeNull();
    expect(parseNumberText('0042')).toBe(42);
    expect(parseNumberText('99999999999999999999')).toBe(Infinity);
    expect(parseNumberText('-99999999999999999999')).toBe(-Infinity);
    expect(clamp(parseNumberText('99999999999999999999') ?? 0, 0, 999_999_999)).toBe(999_999_999);
  });

  it('clamps and steps inside the range', () => {
    expect(clamp(1_000_000_000, 0, 999_999_999)).toBe(999_999_999);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(stepNumber(5, 10, 0, 12)).toBe(12);
    expect(stepNumber(5, -10, 0, 12)).toBe(0);
  });
});

describe('option search', () => {
  const creatures = [
    { label: 'Green Dragon', keywords: 'Rampart' },
    { label: 'Gold Dragon', keywords: 'Rampart' },
    { label: 'Dragon Fly', keywords: 'Fortress' },
    { label: 'Чёрный дракон', keywords: 'Темница' },
  ];

  it('normalizes case, spaces and ё', () => {
    expect(normalizeSearchText('  Чёрный   ДРАКОН ')).toBe('черный дракон');
  });

  it('returns everything for an empty query', () => {
    expect(filterOptions(creatures, '  ')).toHaveLength(4);
  });

  it('puts labels starting with the query first', () => {
    expect(filterOptions(creatures, 'dragon').map((option) => option.label)).toEqual([
      'Dragon Fly',
      'Green Dragon',
      'Gold Dragon',
    ]);
  });

  it('requires every word and searches keywords too', () => {
    expect(filterOptions(creatures, 'rampart gold').map((option) => option.label)).toEqual([
      'Gold Dragon',
    ]);
    expect(filterOptions(creatures, 'черный').map((option) => option.label)).toEqual([
      'Чёрный дракон',
    ]);
  });
});

describe('holding a stepper', () => {
  it('repeats faster and faster down to the top speed', () => {
    expect(holdInterval(0)).toBe(HOLD.firstIntervalMs);
    expect(holdInterval(3)).toBeLessThan(holdInterval(2));
    expect(holdInterval(100)).toBe(HOLD.minIntervalMs);
  });

  it('grows the step tenfold every so many repeats, but not past a twentieth of the range', () => {
    const tenfold = HOLD.repeatsPerTenfold;
    expect(holdStep(0, 1, 0, 1_000_000)).toBe(1);
    expect(holdStep(tenfold, 1, 0, 1_000_000)).toBe(10);
    expect(holdStep(tenfold * 3, 1, 0, 1_000_000)).toBe(1000);
    expect(holdStep(tenfold * 10, 1, 0, 1_000_000)).toBe(10_000);
    expect(holdStep(tenfold * 10, 1, 0, 99)).toBe(1);
  });

  it('lands on round numbers and stays in the range', () => {
    expect(roundStep(13, 10, 1, 0, 100)).toBe(20);
    expect(roundStep(13, 10, -1, 0, 100)).toBe(10);
    expect(roundStep(20, 10, -1, 0, 100)).toBe(10);
    expect(roundStep(5, 1, 1, 0, 100)).toBe(6);
    expect(roundStep(95, 10, 1, 0, 99)).toBe(99);
    expect(roundStep(3, 10, -1, 1, 99)).toBe(1);
  });
});

describe('formatDateTime', () => {
  const saved = new Date(2026, 10, 14, 20, 5).getTime();

  it('writes another day as year.month.day and the time', () => {
    expect(formatDateTime(saved, new Date(2026, 10, 15, 9, 0).getTime())).toBe('2026.11.14 20:05');
  });

  it('says today instead of the date', () => {
    expect(formatDateTime(saved, new Date(2026, 10, 14, 23, 59).getTime())).toBe('today 20:05');
  });
});

describe('resource icons', () => {
  it('draws every resource with whole numbers in its shapes', () => {
    for (const resource of RESOURCES) {
      expect(RESOURCE_ART[resource].length).toBeGreaterThan(0);
      for (const { attrs } of RESOURCE_ART[resource]) {
        expect(Object.values(attrs).join(' ')).not.toMatch(/NaN|undefined|Infinity/);
      }
    }
  });
});

describe('artifacts taken off a hero', () => {
  it('deletes them without the box', () => {
    expect(placeTakenOff([21, 11], false, 'shadowOfDeath', 64)).toEqual({
      toBackpack: [],
      deleted: [21, 11],
      overflow: false,
    });
  });

  it('puts them into the backpack while there is room', () => {
    expect(placeTakenOff([21, 11], true, 'shadowOfDeath', 5)).toEqual({
      toBackpack: [21, 11],
      deleted: [],
      overflow: false,
    });
    expect(placeTakenOff([21, 11, 98], true, 'shadowOfDeath', 1)).toEqual({
      toBackpack: [21],
      deleted: [11, 98],
      overflow: true,
    });
  });

  it('never moves a spell scroll, which would lose its spell', () => {
    expect(placeTakenOff([1, 21], true, 'shadowOfDeath', 64)).toEqual({
      toBackpack: [21],
      deleted: [1],
      overflow: false,
    });
  });
});
