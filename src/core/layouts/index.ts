/**
 * Save layouts, one per family of saves, and the choice of the layout for an opened save.
 * The header decides when it is known; otherwise the edition selected by the user does.
 */

import type { Edition } from '../../data/editions';
import type { SaveBuffer } from '../saveBuffer';
import {
  isArmageddonsBladeHeader,
  SHADOW_OF_DEATH_HEADER_MAJOR,
  type SaveFormat,
} from '../saveFormat';
import {
  ARMAGEDDONS_BLADE_GOG_LAYOUT,
  ARMAGEDDONS_BLADE_LAYOUT,
  armageddonsBladeLayoutAt,
} from './armageddonsBlade';
import { HD_EDITION_LAYOUT } from './hdEdition';
import { RESTORATION_OF_ERATHIA_LAYOUT } from './restorationOfErathia';
import { SHADOW_OF_DEATH_LAYOUT } from './shadowOfDeath';
import type { HeroLayout, LayoutId, SaveLayout } from './types';

export * from './common';
export type { HeroLayout, LayoutId, SaveLayout } from './types';
export { armageddonsBladeLayoutAt } from './armageddonsBlade';

export const LAYOUTS: Record<LayoutId, SaveLayout> = {
  restorationOfErathia: RESTORATION_OF_ERATHIA_LAYOUT,
  hdEdition: HD_EDITION_LAYOUT,
  armageddonsBlade: ARMAGEDDONS_BLADE_LAYOUT,
  armageddonsBladeGog: ARMAGEDDONS_BLADE_GOG_LAYOUT,
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
 * The layout of an opened save. HD Edition has its own, Armageddon's Blade (42/1) too, and
 * Heroes Chronicles uses The Shadow of Death's; for the other known headers the version picks
 * between the older Restoration of Erathia record and the newer one of The Shadow of Death.
 * Horn of the Abyss has no layout of its own yet and is read with the newer one, as before.
 * Armageddon's Blade has two variants: `heroLayoutAt` picks the right one for a hero.
 */
export function layoutFor(format: SaveFormat, edition: Edition): SaveLayout {
  if (isArmageddonsBladeHeader(format)) {
    return ARMAGEDDONS_BLADE_LAYOUT;
  }
  switch (format.kind) {
    case 'hdEdition':
      return HD_EDITION_LAYOUT;
    case 'heroesChronicles':
      return SHADOW_OF_DEATH_LAYOUT;
    case 'classic':
    case 'hornOfTheAbyss':
      return format.major < SHADOW_OF_DEATH_HEADER_MAJOR
        ? RESTORATION_OF_ERATHIA_LAYOUT
        : SHADOW_OF_DEATH_LAYOUT;
    case 'unknown':
      return LAYOUTS[EDITION_LAYOUT[edition]];
  }
}

/**
 * The hero layout for the hero whose name starts at `position`: `layoutFor`, with the
 * Armageddon's Blade variant told apart by the hero's backpack.
 */
export function heroLayoutAt(
  format: SaveFormat,
  edition: Edition,
  buffer: SaveBuffer,
  position: number,
): HeroLayout {
  const layout = layoutFor(format, edition);
  return layout.id === 'armageddonsBlade'
    ? armageddonsBladeLayoutAt(buffer, position).hero
    : layout.hero;
}
