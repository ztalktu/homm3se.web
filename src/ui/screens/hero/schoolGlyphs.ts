/**
 * Signs of the four magic schools, drawn in their quarter of the 24×24 "all schools" badge.
 * The secondary skill badges reuse them, scaled up to fill a badge of their own.
 */
import type { MagicSchool } from '../../../data/spells';

interface SchoolGlyph {
  d: string;
  /** Drawn as a line, not a filled shape. */
  stroke?: boolean;
  /** Top left corner of the school's quarter in the 24×24 badge. */
  quarter: readonly [number, number];
}

export const SCHOOL_GLYPHS: Record<MagicSchool, SchoolGlyph> = {
  air: {
    d: 'M3 5.2h4.6a1.5 1.5 0 1 0-1.5-1.5M3 8h6.2a1.5 1.5 0 1 1-1.5 1.5',
    stroke: true,
    quarter: [1, 1],
  },
  fire: {
    d: 'M17.5 2.6c.8 2 2.8 3 2.8 5.2a2.8 2.8 0 0 1-5.6 0c0-1.2.6-2 1.2-2.5 0 1 .6 1.5 1.1 1.5 0-1.6-.4-2.6.5-4.2z',
    quarter: [12, 1],
  },
  earth: { d: 'M2.4 20.6l3.3-6 1.9 3.2 1.3-2 2.6 4.8z', quarter: [1, 12] },
  water: {
    d: 'M17.5 13.6s-2.8 3.1-2.8 4.9a2.8 2.8 0 0 0 5.6 0c0-1.8-2.8-4.9-2.8-4.9z',
    quarter: [12, 12],
  },
};

/** Transform that blows a school's quarter up to the whole 24×24 box. */
export function fillBadge(school: MagicSchool): string {
  const [x, y] = SCHOOL_GLYPHS[school].quarter;
  return `translate(${1 - 2 * x} ${1 - 2 * y}) scale(2)`;
}
