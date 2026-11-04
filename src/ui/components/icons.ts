/**
 * Our own small icon set: 24×24 outline paths drawn with `currentColor`.
 * Kept as data so the bundle carries only what we use and no icon library is needed.
 */

function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
}

export const ICONS = {
  open: 'M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v1M3 7v10a2 2 0 0 0 2 2h12.4a1.5 1.5 0 0 0 1.4-1.1L21 11H7.6a1.5 1.5 0 0 0-1.4 1.1L4 19',
  save: 'M6 4h10l4 4v11a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 4v5h7V4M8 20v-6h8v6',
  settings: 'M4 6h9M17 6h3M15 4v4M4 12h3M11 12h9M9 10v4M4 18h11M19 18h1M17 16v4',
  info: `${circle(12, 12, 9)}M12 11v5M12 8h.01`,
  search: `${circle(11, 11, 7)}M20 20l-4-4`,
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  chevronDown: 'M6 9l6 6 6-6',
  chevronUp: 'M6 15l6-6 6 6',
  check: 'M5 12l5 5L20 7',
  warning: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  hero: 'M14.5 3.5L20.5 3.5L20.5 9.5L10 20l-4-4zM6 16l-2.5 2.5L5.5 20.5 8 18M8 14l2 2',
  chest:
    'M4 11h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM4 11a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5M10 14h4v3h-4z',
} as const;

export type IconName = keyof typeof ICONS;
