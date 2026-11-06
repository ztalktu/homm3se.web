/**
 * Ubisoft's Heroes III HD Edition (header major 18, minor 0). It has the Restoration of Erathia
 * content and hero records, checked byte for byte on the saves in saves/H2HD. Unlike the
 * classic game it writes a correct gzip CRC. Kept as its own layout so that differences found
 * later (the player block is not located yet) go here and not into Restoration of Erathia.
 */

import { RESTORATION_OF_ERATHIA_LAYOUT } from './restorationOfErathia';
import type { SaveLayout } from './types';

export const HD_EDITION_LAYOUT: SaveLayout = {
  id: 'hdEdition',
  hero: { ...RESTORATION_OF_ERATHIA_LAYOUT.hero },
};
