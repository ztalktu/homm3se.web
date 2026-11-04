/** Level and experience kept in sync, as with the "auto level" and "auto experience" boxes. */

import { LEVEL_EXPERIENCE, MAX_LEVEL } from '../data/experience';

/** Experience at the start of `level` (1–75). */
export function experienceForLevel(level: number): number {
  const clamped = Math.min(Math.max(Math.trunc(level), 1), MAX_LEVEL);
  return LEVEL_EXPERIENCE[clamped - 1] ?? 0;
}

/** Highest level whose threshold `experience` has reached. */
export function levelForExperience(experience: number): number {
  let level = 1;
  for (let index = 1; index < MAX_LEVEL; index += 1) {
    const threshold = LEVEL_EXPERIENCE[index];
    if (threshold === undefined || experience < threshold) {
      break;
    }
    level = index + 1;
  }
  return level;
}
