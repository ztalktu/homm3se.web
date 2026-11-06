import { readJson, writeJson } from '../storage/localStore';

export const LOCALES = ['en', 'ru'] as const;
export type Locale = (typeof LOCALES)[number];

export const THEME_PREFERENCES = ['system', 'dark', 'light'] as const;
type ThemePreference = (typeof THEME_PREFERENCES)[number];
type Theme = Exclude<ThemePreference, 'system'>;

interface StoredPreferences {
  version: 1;
  locale: Locale;
  theme: ThemePreference;
}

const STORAGE_KEY = 'preferences';

const DEFAULT_PREFERENCES: StoredPreferences = {
  version: 1,
  locale: 'en',
  theme: 'system',
};

function isStoredPreferences(value: unknown): value is StoredPreferences {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate['version'] === 1 &&
    LOCALES.includes(candidate['locale'] as Locale) &&
    THEME_PREFERENCES.includes(candidate['theme'] as ThemePreference)
  );
}

/** User preferences that survive page reloads. Change them only through the setters below. */
export const preferences: StoredPreferences = $state(
  readJson(STORAGE_KEY, DEFAULT_PREFERENCES, isStoredPreferences),
);

function save(): void {
  writeJson(STORAGE_KEY, $state.snapshot(preferences));
}

export function setLocale(locale: Locale): void {
  preferences.locale = locale;
  save();
}

export function setThemePreference(theme: ThemePreference): void {
  preferences.theme = theme;
  save();
}

/** Turns the stored preference into the theme to paint, following the OS when set to "system". */
export function resolveTheme(preference: ThemePreference, systemPrefersDark: boolean): Theme {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }
  return preference;
}
