import type { Locale } from '../app/preferences.svelte';
import enHistory from './en/history.json';
import enLegacyHistory from './en/legacyHistory.json';
import ruHistory from './ru/history.json';
import ruLegacyHistory from './ru/legacyHistory.json';

/** Change markers of the original 2001–2005 history: (!) (+) (*) (-) (d). */
export const CHANGE_KINDS = ['major', 'added', 'changed', 'fixed', 'removed'] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];

interface HistoryChange {
  kind: ChangeKind;
  /** May contain line breaks for nested lists. */
  text: string;
  /** Who found the bug, as credited in the original history. */
  credit?: string;
}

export interface HistoryRelease {
  version: string;
  /** ISO date (YYYY-MM-DD), or null while the release is still in development. */
  date: string | null;
  summary?: string;
  changes: HistoryChange[];
}

/** Shape of the JSON files before validation: `kind` is typed as a plain string. */
interface RawRelease {
  version: string;
  date: string | null;
  summary?: string;
  changes: { kind: string; text: string; credit?: string }[];
}

function isChangeKind(value: string): value is ChangeKind {
  return (CHANGE_KINDS as readonly string[]).includes(value);
}

function parseHistory(releases: RawRelease[]): HistoryRelease[] {
  return releases.map(({ version, date, summary, changes }) => ({
    version,
    date,
    ...(summary === undefined ? {} : { summary }),
    changes: changes.map(({ kind, text, credit }) => {
      if (!isChangeKind(kind)) {
        throw new Error(`Unknown change kind "${kind}" in version ${version}`);
      }
      return { kind, text, ...(credit === undefined ? {} : { credit }) };
    }),
  }));
}

/** Web releases, newest first. */
export const histories: Record<Locale, HistoryRelease[]> = {
  en: parseHistory(enHistory),
  ru: parseHistory(ruHistory),
};

/** Windows releases 1.00–2.05 (2001–2005), newest first, converted from Document/history.html. */
export const legacyHistories: Record<Locale, HistoryRelease[]> = {
  en: parseHistory(enLegacyHistory),
  ru: parseHistory(ruLegacyHistory),
};
