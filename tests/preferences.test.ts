import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectLocale, resolveTheme } from '../src/app/preferences.svelte';

describe('resolveTheme', () => {
  it('follows the operating system when set to system', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('keeps an explicit choice regardless of the operating system', () => {
    expect(resolveTheme('dark', false)).toBe('dark');
    expect(resolveTheme('light', true)).toBe('light');
  });
});

describe('stored preferences', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  const browserSpeaks = (...languages: string[]): void => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(languages);
  };

  const load = async (): Promise<typeof import('../src/app/preferences.svelte')> => {
    vi.resetModules();
    return import('../src/app/preferences.svelte');
  };

  it('keeps the language and theme saved before the backpack option existed', async () => {
    localStorage.setItem(
      'homm3se.preferences',
      JSON.stringify({ version: 1, locale: 'ru', theme: 'dark' }),
    );
    const { preferences } = await load();
    expect({ ...preferences }).toEqual({
      version: 1,
      locale: 'ru',
      theme: 'dark',
      moveToBackpack: false,
    });
  });

  it('starts in the browser language until the user picks one', async () => {
    browserSpeaks('ru-RU', 'en');
    (await load()).setThemePreference('dark');
    browserSpeaks('en-US');
    const { preferences, setLocale } = await load();
    expect(preferences.locale).toBe('en');

    setLocale('ru');
    browserSpeaks('en-US');
    expect((await load()).preferences.locale).toBe('ru');
  });

  it('remembers whether taken-off artifacts go to the backpack', async () => {
    (await load()).setMoveToBackpack(true);
    expect((await load()).preferences.moveToBackpack).toBe(true);
  });
});

describe('detectLocale', () => {
  it('takes the first browser language the interface is translated into', () => {
    expect(detectLocale(['de-DE', 'ru-RU', 'en-US'])).toBe('ru');
    expect(detectLocale(['EN-gb', 'ru'])).toBe('en');
  });

  it('falls back to English', () => {
    expect(detectLocale(['de', 'fr'])).toBe('en');
    expect(detectLocale([])).toBe('en');
  });
});
