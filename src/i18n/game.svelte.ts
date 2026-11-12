/**
 * Names from the game (editions, towns, classes, creatures, artifacts, skills, spells)
 * in the interface language. Reactive inside Svelte templates, like `t()`.
 */
import { preferences, type Locale } from '../app/preferences.svelte';
import type { Creature } from '../data/creatures';
import type { Edition } from '../data/editions';
import type { PlayerColor } from '../data/players';
import type { SkillLevel } from '../data/skills';
import enGame from './en/game.json';
import { t } from './index.svelte';
import ruGame from './ru/game.json';

type GameTextKey = keyof typeof enGame;
type GameTexts = Record<GameTextKey, string>;

export const gameDictionaries: Record<Locale, GameTexts> = {
  en: enGame,
  ru: ruGame satisfies GameTexts,
};

/** Unknown ids (newer games, broken records) show as "#id" instead of breaking the screen. */
function lookup(key: string): string {
  const texts: Record<string, string> = gameDictionaries[preferences.locale];
  return texts[key] ?? `#${key.slice(key.indexOf('.') + 1)}`;
}

export const editionName = (edition: Edition): string => lookup(`edition.${edition}`);
export const playerColorName = (color: PlayerColor): string => lookup(`playerColor.${color}`);
export const heroClassName = (id: number): string => lookup(`heroClass.${id}`);
export const creatureName = (id: number): string => lookup(`creature.${id}`);
export const artifactName = (id: number): string => lookup(`artifact.${id}`);
export const skillName = (id: number): string => lookup(`skill.${id}`);
export const skillLevelName = (level: SkillLevel): string => lookup(`skillLevel.${level}`);
export const spellName = (id: number): string => lookup(`spell.${id}`);

/** Short description of what a spell does, shown as a hint in the spell list. */
export const spellEffect = (id: number): string => lookup(`spellEffect.${id}`);

/** Effect of an artifact, or undefined for the "not recommended" ones that have none. */
export function artifactEffect(id: number): string | undefined {
  const texts: Record<string, string> = gameDictionaries[preferences.locale];
  return texts[`artifactEffect.${id}`];
}

/** Second line for a creature in lists: town, level and whether it is upgraded. */
export function creatureDescription(creature: Creature): string {
  switch (creature.kind) {
    case 'placeholder':
      return t('creature.placeholder');
    case 'warMachine':
      return t('creature.warMachine');
    case 'special':
      return t('creature.special');
    case 'regular': {
      const level = creature.upgraded
        ? t('creature.levelUpgraded', { level: creature.level ?? 0 })
        : t('creature.level', { level: creature.level ?? 0 });
      return creature.town ? `${lookup(`town.${creature.town}`)} · ${level}` : level;
    }
  }
}
