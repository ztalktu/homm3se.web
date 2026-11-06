/**
 * Armageddon's Blade (header 42/1): new content, but the hero record of Restoration of
 * Erathia. There are no such saves to check against. FORMAT.md also mentions a newer (GOG)
 * variant with the backpack at +365 that the header does not tell apart; it is not handled.
 */

import { RESTORATION_OF_ERATHIA_LAYOUT } from './restorationOfErathia';
import type { SaveLayout } from './types';

export const ARMAGEDDONS_BLADE_LAYOUT: SaveLayout = {
  id: 'armageddonsBlade',
  hero: { ...RESTORATION_OF_ERATHIA_LAYOUT.hero },
};
