/** Formatting helpers for numbers, sizes and dates in the interface language. */

import { LOCALES, preferences, type Locale } from '../app/preferences.svelte';
import type { GameType } from '../core/saveGame';
import type { SaveFormat } from '../core/saveFormat';
import { t } from '../i18n/index.svelte';

export function formatNumber(value: number): string {
  return value.toLocaleString(preferences.locale);
}

export function formatSize(bytes: number): string {
  const units = preferences.locale === 'ru' ? ['байт', 'КБ', 'МБ'] : ['bytes', 'KB', 'MB'];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const digits = unit === 0 ? 0 : 1;
  return `${size.toLocaleString(preferences.locale, { maximumFractionDigits: digits })} ${units[unit]}`;
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(preferences.locale, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function gameTypeLabel(gameType: GameType): string {
  switch (gameType.kind) {
    case 'campaign':
      return t('info.gameCampaign');
    case 'scenario':
      return gameType.players === 1
        ? t('info.gameScenarioOne')
        : t('info.gameScenario', { players: gameType.players });
    case 'unknown':
      return t('info.gameUnknown');
  }
}

export function formatName(format: SaveFormat): string {
  switch (format.kind) {
    case 'classic':
      return t('format.classic', { version: `${format.major}.${format.minor}` });
    case 'hornOfTheAbyss':
      return t('format.hornOfTheAbyss');
    case 'hdEdition':
      return t('format.hdEdition');
    case 'unknown':
      return t('format.unknown');
  }
}

/** Position of a search hit as a percentage of the file, like the old progress bars. */
export function filePercent(position: number, length: number): number {
  return length > 0 ? Math.round((100 * position) / length) : 0;
}

/** The language list for both language switches, each language named in the current one. */
export function languageOptions(): { value: Locale; label: string }[] {
  return LOCALES.map((locale) => ({ value: locale, label: t(`language.${locale}`) }));
}
