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

/**
 * Holding a stepper button down. Timing follows the usual spin button and key repeat feel:
 * a pause before repeating starts, then steps that come faster and faster up to a top speed;
 * after a while at top speed each step grows tenfold, so large values stay reachable.
 */
export const HOLD = {
  /** Before the first repeat, like the system key repeat delay. */
  delayMs: 400,
  /** Gap between the first repeats. */
  firstIntervalMs: 120,
  /** Each repeat comes this much sooner than the previous one... */
  intervalFactor: 0.85,
  /** ...down to this, about 30 steps a second. */
  minIntervalMs: 30,
  /** Repeats before the step grows tenfold. */
  repeatsPerTenfold: 20,
} as const;

/** Gap before repeat number `repeat` (0-based). */
export function holdInterval(repeat: number): number {
  return Math.max(HOLD.minIntervalMs, HOLD.firstIntervalMs * HOLD.intervalFactor ** repeat);
}

/**
 * Step size at repeat number `repeat`: the base step, times ten for every
 * `repeatsPerTenfold` repeats, but never so big that the range is crossed in a few steps.
 */
export function holdStep(repeat: number, step: number, min: number, max: number): number {
  const range = max - min;
  let size = step;
  for (let tenfolds = Math.floor(repeat / HOLD.repeatsPerTenfold); tenfolds > 0; tenfolds -= 1) {
    if (size * 10 * 20 > range) {
      break;
    }
    size *= 10;
  }
  return size;
}

/**
 * One step of `size` up or down, landing on a multiple of `size` so the numbers stay round
 * (13 goes up to 20, 30, 40 once the step is 10), then kept inside the range.
 */
export function roundStep(
  value: number,
  size: number,
  direction: 1 | -1,
  min: number,
  max: number,
): number {
  const next =
    direction > 0 ? (Math.floor(value / size) + 1) * size : (Math.ceil(value / size) - 1) * size;
  return clamp(next, min, max);
}
