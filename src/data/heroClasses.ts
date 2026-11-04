// Generated from the Heroes III SaveEditor 2.05 sources. Maintained by hand from now on.
import type { Edition } from './editions';

interface HeroClass {
  id: number;
  introducedIn: Edition;
}

/** Hero classes in save file order, 0–17. Planeswalker and Elementalist came with Armageddon's Blade. */
export const HERO_CLASSES: readonly HeroClass[] = [
  { id: 0, introducedIn: 'restorationOfErathia' },
  { id: 1, introducedIn: 'restorationOfErathia' },
  { id: 2, introducedIn: 'restorationOfErathia' },
  { id: 3, introducedIn: 'restorationOfErathia' },
  { id: 4, introducedIn: 'restorationOfErathia' },
  { id: 5, introducedIn: 'restorationOfErathia' },
  { id: 6, introducedIn: 'restorationOfErathia' },
  { id: 7, introducedIn: 'restorationOfErathia' },
  { id: 8, introducedIn: 'restorationOfErathia' },
  { id: 9, introducedIn: 'restorationOfErathia' },
  { id: 10, introducedIn: 'restorationOfErathia' },
  { id: 11, introducedIn: 'restorationOfErathia' },
  { id: 12, introducedIn: 'restorationOfErathia' },
  { id: 13, introducedIn: 'restorationOfErathia' },
  { id: 14, introducedIn: 'restorationOfErathia' },
  { id: 15, introducedIn: 'restorationOfErathia' },
  { id: 16, introducedIn: 'armageddonsBlade' },
  { id: 17, introducedIn: 'armageddonsBlade' },
];
