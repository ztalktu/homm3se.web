/**
 * Building the list hints of the preset windows. Saving lists what goes into the preset; loading
 * marks what changes against the window: + added, − removed, ~ changed, × skipped.
 */

import type { Edition } from '../../../data/editions';
import type { Troop } from '../../../core/hero';
import { creatureName } from '../../../i18n/game.svelte';
import { t } from '../../../i18n/index.svelte';
import type { TooltipList, TooltipMark } from '../../actions/tooltip';
import { formatNumber } from '../../format';

type Group = TooltipList['groups'][number];
type Row = Group['rows'][number];

/** "Pikeman × 17", or null for an empty slot. */
export function troopLabel(troop: Troop | null, edition: Edition): string | null {
  return (
    troop &&
    t('preset.troop', {
      name: creatureName(troop.creatureId, edition),
      count: formatNumber(troop.count),
    })
  );
}

/** "Slot 1" … "Slot 7": the slots of an army or a garrison. */
export function troopSlotLabels(): string[] {
  return Array.from({ length: 7 }, (_, slot) => t('heroDialog.slot', { slot: slot + 1 }));
}

/** Preset hints show sooner than others: moving along the checkboxes reads them one by one. */
export const PRESET_HINT_DELAY_MS = 100;

/**
 * The items of `after`; with `before`, each marked as kept or added, then the ones of `before`
 * that are gone, marked removed.
 */
export function listRows(after: readonly string[], before?: readonly string[]): Row[] {
  if (!before) {
    return after.map((text) => ({ text }));
  }
  const left = [...before];
  const rows = after.map((text): Row => {
    const index = left.indexOf(text);
    if (index < 0) {
      return { text, mark: 'added' };
    }
    left.splice(index, 1);
    return { text, mark: 'same' };
  });
  return [...rows, ...left.map((text): Row => ({ text, mark: 'removed' }))];
}

/**
 * Slots with what is in them, empty ones left out; with `before`, a changed slot shows
 * "was → now".
 */
export function slotRows(
  labels: readonly string[],
  after: readonly (string | null)[],
  before?: readonly (string | null)[],
): Row[] {
  return labels.flatMap((slot, index): Row[] => {
    const now = after[index] ?? null;
    const was = before ? (before[index] ?? null) : now;
    if (now === null && was === null) {
      return [];
    }
    const row = (value: string, mark?: TooltipMark): Row[] => [
      { text: t('preset.slotRow', { slot, value }), mark },
    ];
    if (!before) {
      return row(now ?? '');
    }
    if (was === now) {
      return row(now ?? '', 'same');
    }
    if (was === null) {
      return row(now ?? '', 'added');
    }
    if (now === null) {
      return row(was, 'removed');
    }
    return row(t('preset.change', { from: was, to: now }), 'changed');
  });
}

/** One value: what will be saved, or what it becomes. */
export function valueRow(after: string, before?: string): Row {
  if (before === undefined) {
    return { text: t('preset.willSave', { value: after }) };
  }
  return before === after
    ? { text: t('preset.unchanged', { value: after }), mark: 'same' }
    : { text: t('preset.change', { from: before, to: after }), mark: 'changed' };
}

/** The group of what the target save cannot hold, when there is any. */
export function skippedGroup(names: readonly string[], label = t('preset.skippedGroup')): Group[] {
  return names.length > 0
    ? [{ label, rows: names.map((text): Row => ({ text, mark: 'skipped' })) }]
    : [];
}

export function hint(
  title: string,
  groups: Group[],
  ...notes: (string | undefined)[]
): TooltipList {
  const note = notes.filter(Boolean).join(' ');
  return { title, groups, note: note || undefined };
}
