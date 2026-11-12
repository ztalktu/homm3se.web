/**
 * Players of a map, in color order. The game stores a player as its color index 0–7,
 * and the in-game player number is that index plus one (Red is player 1).
 */

export const PLAYER_COLORS = [
  'red',
  'blue',
  'tan',
  'green',
  'orange',
  'purple',
  'teal',
  'pink',
] as const;

export type PlayerColor = (typeof PLAYER_COLORS)[number];
