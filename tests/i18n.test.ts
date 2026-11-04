import { describe, expect, it } from 'vitest';
import { LOCALES } from '../src/app/preferences.svelte';
import { CHANGE_KINDS, histories, legacyHistories } from '../src/i18n/history';
import { dictionaries, formatMessage, translate } from '../src/i18n/index.svelte';

describe('interface dictionaries', () => {
  const englishKeys = Object.keys(dictionaries.en).sort();

  it.each(LOCALES)('%s has exactly the same keys as English', (locale) => {
    expect(Object.keys(dictionaries[locale]).sort()).toEqual(englishKeys);
  });

  it.each(LOCALES)('%s has no empty messages', (locale) => {
    const empty = Object.entries(dictionaries[locale]).filter(([, text]) => text.trim() === '');
    expect(empty).toEqual([]);
  });

  it.each(LOCALES)('%s keeps the same placeholders as English', (locale) => {
    const placeholders = (text: string): string[] => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const key of englishKeys) {
      const typedKey = key as keyof typeof dictionaries.en;
      expect(placeholders(dictionaries[locale][typedKey]), key).toEqual(
        placeholders(dictionaries.en[typedKey]),
      );
    }
  });
});

describe('formatMessage', () => {
  it('replaces known placeholders and keeps unknown ones', () => {
    expect(formatMessage('Version {version} by {author}', { version: '3.0' })).toBe(
      'Version 3.0 by {author}',
    );
  });

  it('translates with parameters', () => {
    expect(translate('ru', 'app.version', { version: '3.0' })).toBe('Версия 3.0');
  });
});

describe.each([
  ['web version history', histories],
  ['Windows version history', legacyHistories],
] as const)('%s', (_name, source) => {
  it('lists the same releases with the same dates in every language', () => {
    const releases = (locale: (typeof LOCALES)[number]): string[] =>
      source[locale].map((release) => `${release.version} ${release.date ?? 'unreleased'}`);
    for (const locale of LOCALES) {
      expect(releases(locale)).toEqual(releases('en'));
    }
  });

  it('has the same change kinds and credits in the same order in every language', () => {
    const outline = (locale: (typeof LOCALES)[number]): string[][] =>
      source[locale].map((release) =>
        release.changes.map((change) => `${change.kind}${change.credit ? '+credit' : ''}`),
      );
    for (const locale of LOCALES) {
      expect(outline(locale)).toEqual(outline('en'));
    }
  });

  it('uses only known change kinds and valid dates', () => {
    for (const locale of LOCALES) {
      for (const release of source[locale]) {
        if (release.date !== null) {
          expect(release.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
        for (const change of release.changes) {
          expect(CHANGE_KINDS).toContain(change.kind);
          expect(change.text.trim()).not.toBe('');
        }
      }
    }
  });
});

describe('Windows version history', () => {
  it('covers versions 1.00 to 2.05, newest first', () => {
    const versions = legacyHistories.en.map((release) => release.version);
    expect(versions[0]).toBe('2.05');
    expect(versions.at(-1)).toBe('1.00');
    expect(versions).toHaveLength(11);
  });
});
