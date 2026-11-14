// Generated from the Heroes III SaveEditor 2.05 sources. Maintained by hand from now on.
import type { Town } from './creatures';
import type { Edition } from './editions';

interface HeroClass {
  id: number;
  introducedIn: Edition;
  /** Each town has two classes, might and magic, in save file order. */
  town: Town;
}

/**
 * Hero classes in save file order, 0–23. Planeswalker and Elementalist came with Armageddon's
 * Blade; 18–23 are the Horn of the Abyss towns: Captain and Navigator (Cove), Mercenary and
 * Artificer (Factory), Chieftain and Elder (Bulwark), might class first.
 */
export const HERO_CLASSES: readonly HeroClass[] = [
  { id: 0, introducedIn: 'restorationOfErathia', town: 'castle' },
  { id: 1, introducedIn: 'restorationOfErathia', town: 'castle' },
  { id: 2, introducedIn: 'restorationOfErathia', town: 'rampart' },
  { id: 3, introducedIn: 'restorationOfErathia', town: 'rampart' },
  { id: 4, introducedIn: 'restorationOfErathia', town: 'tower' },
  { id: 5, introducedIn: 'restorationOfErathia', town: 'tower' },
  { id: 6, introducedIn: 'restorationOfErathia', town: 'inferno' },
  { id: 7, introducedIn: 'restorationOfErathia', town: 'inferno' },
  { id: 8, introducedIn: 'restorationOfErathia', town: 'necropolis' },
  { id: 9, introducedIn: 'restorationOfErathia', town: 'necropolis' },
  { id: 10, introducedIn: 'restorationOfErathia', town: 'dungeon' },
  { id: 11, introducedIn: 'restorationOfErathia', town: 'dungeon' },
  { id: 12, introducedIn: 'restorationOfErathia', town: 'stronghold' },
  { id: 13, introducedIn: 'restorationOfErathia', town: 'stronghold' },
  { id: 14, introducedIn: 'restorationOfErathia', town: 'fortress' },
  { id: 15, introducedIn: 'restorationOfErathia', town: 'fortress' },
  { id: 16, introducedIn: 'armageddonsBlade', town: 'conflux' },
  { id: 17, introducedIn: 'armageddonsBlade', town: 'conflux' },
  { id: 18, introducedIn: 'hornOfTheAbyss', town: 'cove' },
  { id: 19, introducedIn: 'hornOfTheAbyss', town: 'cove' },
  { id: 20, introducedIn: 'hornOfTheAbyss', town: 'factory' },
  { id: 21, introducedIn: 'hornOfTheAbyss', town: 'factory' },
  { id: 22, introducedIn: 'hornOfTheAbyss', town: 'bulwark' },
  { id: 23, introducedIn: 'hornOfTheAbyss', town: 'bulwark' },
];

/** The town a hero of this class belongs to, if the class is known. */
export function classTown(classId: number): Town | undefined {
  return HERO_CLASSES[classId]?.town;
}
