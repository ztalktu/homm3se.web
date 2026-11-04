import { describe, expect, it } from 'vitest';
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
