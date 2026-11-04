import { beforeEach, describe, expect, it } from 'vitest';
import { readJson, writeJson } from '../src/storage/localStore';

const isNumber = (value: unknown): value is number => typeof value === 'number';

describe('localStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('round-trips JSON values under a prefixed key', () => {
    writeJson('answer', 42);
    expect(localStorage.getItem('homm3se.answer')).toBe('42');
    expect(readJson('answer', 0, isNumber)).toBe(42);
  });

  it('returns the fallback for missing, broken or invalid values', () => {
    expect(readJson('missing', 7, isNumber)).toBe(7);

    localStorage.setItem('homm3se.broken', '{not json');
    expect(readJson('broken', 7, isNumber)).toBe(7);

    localStorage.setItem('homm3se.invalid', '"text"');
    expect(readJson('invalid', 7, isNumber)).toBe(7);
  });
});
