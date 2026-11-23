/**
 * Names from the game (editions, towns, classes, creatures, artifacts, skills, spells)
 * in the interface language. Reactive inside Svelte templates, like `t()`.
 */
import { preferences, type Locale } from '../app/preferences.svelte';
import { artifactById, isHotaArtifact } from '../data/artifacts';
import { isHotaCreature } from '../data/creatures';
import type { Creature, Town } from '../data/creatures';
import type { Edition } from '../data/editions';
import { PLAYER_COLORS, type PlayerColor } from '../data/players';
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

/** "Red (player 1)", or "free" for a hero nobody owns. */
export function playerLabel(color: PlayerColor | null): string {
  return color
    ? t('hero.playerColor', {
        color: playerColorName(color),
        number: PLAYER_COLORS.indexOf(color) + 1,
      })
    : t('hero.noPlayer');
}
export const heroClassName = (id: number): string => lookup(`heroClass.${id}`);
export const townName = (town: Town): string => lookup(`town.${town}`);
/**
 * Horn of the Abyss gives some ids its own creatures and artifacts (the same ids mean other ones
 * in In the Wake of Gods saves): their texts live under `creature.hota.<id>` and so on.
 */
export const creatureName = (id: number, edition: Edition): string =>
  lookup(isHotaCreature(id, edition) ? `creature.hota.${id}` : `creature.${id}`);
export const artifactName = (id: number, edition: Edition): string =>
  lookup(isHotaArtifact(id, edition) ? `artifact.hota.${id}` : `artifact.${id}`);
export const skillName = (id: number): string => lookup(`skill.${id}`);

/** Town buildings: a faction's own text first, then the one every town shares. */
function buildingText(kind: 'building' | 'buildingDescription', town: Town, id: number): string {
  const texts: Record<string, string> = gameDictionaries[preferences.locale];
  return texts[`${kind}.${town}.${id}`] ?? texts[`${kind}.${id}`] ?? `#${id}`;
}
export const buildingName = (town: Town, id: number): string => buildingText('building', town, id);
export const buildingDescription = (town: Town, id: number): string =>
  buildingText('buildingDescription', town, id);
export const skillLevelName = (level: SkillLevel): string => lookup(`skillLevel.${level}`);
export const spellName = (id: number): string => lookup(`spell.${id}`);

/** Short description of what a spell does, shown as a hint in the spell list. */
export const spellEffect = (id: number): string => lookup(`spellEffect.${id}`);

/** Effect of an artifact, or undefined for the unused ones that have none. */
export function artifactEffect(id: number, edition: Edition): string | undefined {
  const texts: Record<string, string> = gameDictionaries[preferences.locale];
  return texts[isHotaArtifact(id, edition) ? `artifactEffect.hota.${id}` : `artifactEffect.${id}`];
}

/** Second line for an artifact in lists: its effect, or a warning for the unused ones. */
export function artifactDescription(id: number, edition: Edition): string | undefined {
  return artifactById(id, edition)?.unused ? t('joke.notRecommended') : artifactEffect(id, edition);
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
      return creature.town ? `${townName(creature.town)} · ${level}` : level;
    }
  }
}
