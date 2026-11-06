/**
 * Save layouts, one per family of saves, and the choice of the layout for an opened save.
 * The header decides when it is known; otherwise the edition selected by the user does.
 */

import type { Edition } from '../../data/editions';
import { SHADOW_OF_DEATH_HEADER_MAJOR, type SaveFormat } from '../saveFormat';
import { ARMAGEDDONS_BLADE_LAYOUT } from './armageddonsBlade';
import { HD_EDITION_LAYOUT } from './hdEdition';
import { RESTORATION_OF_ERATHIA_LAYOUT } from './restorationOfErathia';
import { SHADOW_OF_DEATH_LAYOUT } from './shadowOfDeath';
import type { LayoutId, SaveLayout } from './types';

export * from './common';
export type { HeroLayout, LayoutId, SaveLayout } from './types';

export const LAYOUTS: Record<LayoutId, SaveLayout> = {
  restorationOfErathia: RESTORATION_OF_ERATHIA_LAYOUT,
  hdEdition: HD_EDITION_LAYOUT,
  armageddonsBlade: ARMAGEDDONS_BLADE_LAYOUT,
  shadowOfDeath: SHADOW_OF_DEATH_LAYOUT,
};

/** The layout each edition writes, used when the header does not tell. */
export const EDITION_LAYOUT: Record<Edition, LayoutId> = {
  restorationOfErathia: 'restorationOfErathia',
  hdEdition: 'hdEdition',
  armageddonsBlade: 'armageddonsBlade',
  shadowOfDeath: 'shadowOfDeath',
  heroesChronicles: 'shadowOfDeath',
  inTheWakeOfGods: 'shadowOfDeath',
};

/**
 * The layout of an opened save. HD Edition has its own; for the other known headers the
 * version picks between the older Restoration of Erathia record and the newer one of
 * The Shadow of Death. Horn of the Abyss has no layout of its own yet and is read with the
 * newer one, as before.
 */
export function layoutFor(format: SaveFormat, edition: Edition): SaveLayout {
  switch (format.kind) {
    case 'hdEdition':
      return HD_EDITION_LAYOUT;
    case 'classic':
    case 'hornOfTheAbyss':
      return format.major < SHADOW_OF_DEATH_HEADER_MAJOR
        ? RESTORATION_OF_ERATHIA_LAYOUT
        : SHADOW_OF_DEATH_LAYOUT;
    case 'unknown':
      return LAYOUTS[EDITION_LAYOUT[edition]];
  }
}
