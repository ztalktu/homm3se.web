import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveTheme } from '../src/app/preferences.svelte';

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
    vi.resetModules();
  });

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

  it('remembers whether taken-off artifacts go to the backpack', async () => {
    (await load()).setMoveToBackpack(true);
    expect((await load()).preferences.moveToBackpack).toBe(true);
  });
});
