import { describe, expect, it } from 'vitest';
import { filterOptions, normalizeSearchText } from '../src/ui/logic/filterOptions';
import {
  clamp,
  parseNumberText,
  sanitizeNumberText,
  stepNumber,
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
