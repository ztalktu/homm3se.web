/**
 * Thin wrapper around localStorage. Every key is prefixed, values are JSON,
 * and storage failures (private mode, quota, disabled storage) never break the app:
 * reads fall back to the default value and writes are silently skipped.
 */

const KEY_PREFIX = 'homm3se.';

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function readJson<T>(key: string, fallback: T, isValid: (value: unknown) => value is T): T {
  try {
    const raw = storage()?.getItem(KEY_PREFIX + key);
    if (raw == null) {
      return fallback;
    }
    const value: unknown = JSON.parse(raw);
    return isValid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    storage()?.setItem(KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage is unavailable or full: the setting simply is not remembered.
  }
}
