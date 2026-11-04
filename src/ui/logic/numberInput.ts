/** Pure helpers behind NumberField, kept separate so they can be unit tested. */

/** Keeps only digits (and one leading minus when negative values are allowed). */
export function sanitizeNumberText(text: string, allowNegative: boolean): string {
  const negative = allowNegative && text.trimStart().startsWith('-');
  const digits = text.replace(/\D/g, '');
  return negative ? `-${digits}` : digits;
}

/** Parses sanitized text; returns null for empty input or a lone minus. */
export function parseNumberText(text: string): number | null {
  if (text === '' || text === '-') {
    return null;
  }
  const value = Number(text);
  return Number.isSafeInteger(value) ? value : null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Moves the value by `delta` and keeps it inside the allowed range. */
export function stepNumber(value: number, delta: number, min: number, max: number): number {
  return clamp(value + delta, min, max);
}
