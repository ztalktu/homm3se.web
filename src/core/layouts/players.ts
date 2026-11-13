/**
 * How to find the block of the eight player records in each game: records of colors 0–7 one
 * after another, each starting with its color byte. Games whose saves have not shown the block
 * yet map to null, and their treasury is searched by amounts only.
 */

import {
  isArmageddonsBladeHeader,
  SHADOW_OF_DEATH_HEADER_MAJOR,
  type SaveFormat,
} from '../saveFormat';

export interface PlayerBlockLayout {
  /** Bytes from one player record to the next. */
  readonly recordSize: number;
  /** Treasury gold, from the first byte (the color) of a record. */
  readonly gold: number;
}

/** Games told apart for the player block; Horn of the Abyss differs from The Shadow of Death. */
type PlayerBlockGame =
  | 'restorationOfErathia'
  | 'hdEdition'
  | 'armageddonsBlade'
  | 'shadowOfDeath'
  | 'hornOfTheAbyss'
  | 'heroesChronicles'
  | 'unknown';

export const PLAYER_BLOCKS: Record<PlayerBlockGame, PlayerBlockLayout | null> = {
  restorationOfErathia: { recordSize: 143, gold: 122 },
  hdEdition: { recordSize: 143, gold: 122 },
  armageddonsBlade: null,
  shadowOfDeath: { recordSize: 145, gold: 122 },
  hornOfTheAbyss: { recordSize: 149, gold: 122 },
  heroesChronicles: null,
  unknown: null,
};

/** The game whose player block an opened save has, from its header. */
function playerBlockGame(format: SaveFormat): PlayerBlockGame {
  switch (format.kind) {
    case 'hdEdition':
    case 'hornOfTheAbyss':
    case 'heroesChronicles':
    case 'unknown':
      return format.kind;
    case 'classic':
      if (isArmageddonsBladeHeader(format)) {
        return 'armageddonsBlade';
      }
      return format.major < SHADOW_OF_DEATH_HEADER_MAJOR ? 'restorationOfErathia' : 'shadowOfDeath';
  }
}

/** How to find the player block in an opened save, or null when that is not known. */
export function playerBlockFor(format: SaveFormat): PlayerBlockLayout | null {
  return PLAYER_BLOCKS[playerBlockGame(format)];
}
