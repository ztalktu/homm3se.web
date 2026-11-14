import { describe, expect, it } from 'vitest';
import { formatDateTime } from '../src/ui/format';
import { filterOptions, normalizeSearchText } from '../src/ui/logic/filterOptions';
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
    expect(parseNumberText('99999999999999999999')).toBeNull();
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
