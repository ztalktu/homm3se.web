/**
 * The editing session: the opened save, the selected edition and the state of both searches.
 * Screens read `session` and change it only through the actions below.
 */

import { EDITIONS, isAvailableIn, type Edition } from '../data/editions';
import { KNOWN_HERO_NAMES } from '../data/heroNames';
import { PLAYER_COLORS, type PlayerColor } from '../data/players';
import { requiredEdition } from '../core/editionDetection';
import {
  hasHeroChanges,
  heroChanges,
  resourceChanges,
  type HeroChanges,
  type ResourceChange,
} from '../core/changes';
import { readHero, readHeroOwner, writeHero, type Hero, type HeroOwner } from '../core/hero';
import { findHero, findHeroNames, findNextHero, type HeroMatch } from '../core/heroSearch';
import {
  heroLayoutAt,
  OTHER_RESOURCES,
  playerBlockFor,
  RESOURCES,
  type HeroLayout,
  type OtherResource,
} from '../core/layouts';
import {
  findPlayerTreasuries,
  findResources,
  readResources,
  writeResources,
  type ResourceAmounts,
  type ResourceQuery,
} from '../core/resources';
import { NotASaveError, SaveGame, editedFileName } from '../core/saveGame';
import type { SaveBuffer } from '../core/saveBuffer';
import type { CodePage } from '../core/textEncoding';
import {
  editionFromHeader,
  isEditingTested,
  isSameFormat,
  minimumEditionFor,
} from '../core/saveFormat';
import { editionName } from '../i18n/game.svelte';
import { formatName } from '../ui/format';
import { t } from '../i18n/index.svelte';
import { readJson, writeJson } from '../storage/localStore';
import { SaveCancelledError, saveBytes } from './fileAccess';
import { showToast } from './toasts.svelte';

interface StoredSession {
  version: 1;
  edition: Edition;
}

const STORAGE_KEY = 'session';

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return candidate['version'] === 1 && EDITIONS.includes(candidate['edition'] as Edition);
}

const stored = readJson<StoredSession>(
  STORAGE_KEY,
  { version: 1, edition: 'restorationOfErathia' },
  isStoredSession,
);

/** A hero record the user applied changes to, read the same way it was written. */
interface EditedHero {
  position: number;
  layout: HeroLayout;
  codePage: CodePage;
}

interface Session {
  /** Not reactive by itself: `revision` changes whenever the save is opened or edited. */
  save: SaveGame | null;
  revision: number;
  edition: Edition;
  /** Counts the times the editor changed the edition by itself, so the header can point it out. */
  editionAutoChanges: number;
  /** File name and time (ms since epoch) of the last successful save. */
  savedAs: { fileName: string; at: number } | null;
  /** Hero records and treasuries (gold positions) changed since the save was opened. */
  edited: { heroes: EditedHero[]; treasuries: number[] };
  heroName: string;
  heroMatch: HeroMatch | null;
  /** Name `heroMatch` was found by: "Find hero" continues only while the name stays the same. */
  heroMatchName: string | null;
  /**
   * Known hero names that have a hero record in the open save, with the owners of those
   * records; null when no save is open.
   */
  heroNamesInSave: ReadonlyMap<string, readonly HeroOwner[]> | null;
  /**
   * The only owner the player filter shows in the name list (null: free heroes), or undefined
   * when the filter is off. The search itself finds heroes of any owner.
   */
  ownerFilter: HeroOwner | undefined;
  /**
   * Gold positions of the eight players' treasuries in color order, or null when the save's
   * game has no known player block or the block was not found.
   */
  playerTreasuries: readonly number[] | null;
  /**
   * True: the treasury is searched by the amounts of resources. False: it is picked by the
   * player's color from `playerTreasuries`. Starts false whenever the save has the block.
   */
  resourceSearchByAmount: boolean;
  goldQuery: number;
  /** Other resources ticked to narrow the search, with their current amounts. */
  resourceFilters: Record<OtherResource, { enabled: boolean; amount: number }>;
  goldPosition: number | null;
  /**
   * The search `goldPosition` was found by, as a key: "Find resources" continues only while the
   * search stays the same. Null when the treasury was picked by color or nothing is found.
   */
  goldMatchQuery: string | null;
}

function emptyFilters(): Session['resourceFilters'] {
  return {
    wood: { enabled: false, amount: 0 },
    mercury: { enabled: false, amount: 0 },
    ore: { enabled: false, amount: 0 },
    sulfur: { enabled: false, amount: 0 },
    crystal: { enabled: false, amount: 0 },
    gems: { enabled: false, amount: 0 },
  };
}

export const session: Session = $state({
  save: null,
  revision: 0,
  edition: stored.edition,
  editionAutoChanges: 0,
  savedAs: null,
  edited: { heroes: [], treasuries: [] },
  heroName: '',
  heroMatch: null,
  heroMatchName: null,
  heroNamesInSave: null,
  ownerFilter: undefined,
  playerTreasuries: null,
  resourceSearchByAmount: true,
  goldQuery: 0,
  resourceFilters: emptyFilters(),
  goldPosition: null,
  goldMatchQuery: null,
});

function remember(): void {
  writeJson(STORAGE_KEY, {
    version: 1,
    edition: session.edition,
  } satisfies StoredSession);
}

function errorReason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ---------- file ----------

export async function openSaveFile(file: File): Promise<void> {
  try {
    const save = await SaveGame.open(file.name, new Uint8Array(await file.arrayBuffer()));
    const sameVersion = session.save !== null && isSameFormat(session.save.format, save.format);
    session.save = save;
    session.savedAs = null;
    session.edited = { heroes: [], treasuries: [] };
    session.heroMatch = null;
    session.heroMatchName = null;
    session.heroNamesInSave = findHeroNames(save.buffer, KNOWN_HERO_NAMES);
    // A save of another game version starts with an empty name field. With the same version
    // the last search stays, unless it is a listed name this save has no hero for.
    const name = session.heroName.trim();
    const missing = KNOWN_HERO_NAMES.includes(name) && !session.heroNamesInSave.has(name);
    if (!sameVersion || missing) {
      session.heroName = '';
    }
    session.goldPosition = null;
    session.goldMatchQuery = null;
    const playerBlock = playerBlockFor(save.format);
    session.playerTreasuries = playerBlock && findPlayerTreasuries(save.buffer, playerBlock);
    session.resourceSearchByAmount = session.playerTreasuries === null;
    applyEditionFromFormat(save);
    session.revision += 1;
    if (!isEditingTested(save.format)) {
      showToast(t('message.unsupportedFormat', { game: formatName(save.format) }), {
        kind: 'warning',
        duration: 0,
      });
    }
  } catch (error) {
    const message =
      error instanceof NotASaveError
        ? t('message.notASave', { file: file.name })
        : t('message.openFailed', { reason: errorReason(error) });
    showToast(message, { kind: 'error' });
  }
}

/**
 * The header already names the game. When only one edition writes it (HD Edition,
 * Heroes Chronicles, Armageddon's Blade) the save gets that edition outright;
 * for the others the edition is raised to what the header needs, never lowered.
 */
function applyEditionFromFormat(save: SaveGame): void {
  const exact = editionFromHeader(save.format);
  if (exact) {
    if (session.edition !== exact) {
      session.edition = exact;
      session.editionAutoChanges += 1;
      remember();
      showToast(t('message.editionFromHeader', { edition: editionName(exact) }));
    }
    return;
  }
  const minimum = minimumEditionFor(save.format);
  if (minimum && !isAvailableIn(minimum, session.edition)) {
    session.edition = minimum;
    session.editionAutoChanges += 1;
    remember();
    showToast(t('message.editionRaised', { edition: editionName(minimum) }), { kind: 'warning' });
  }
}

/** Packs and writes the save. Returns false if the user cancelled or writing failed. */
export async function saveCurrent(): Promise<boolean> {
  const save = session.save;
  if (!save) {
    return false;
  }
  try {
    const packed = await save.pack();
    const suggested = session.savedAs?.fileName ?? editedFileName(save.fileName);
    const fileName = await saveBytes(packed.file, suggested, t('app.title'));
    save.markSaved(packed);
    session.savedAs = { fileName, at: Date.now() };
    session.revision += 1;
    showToast(t('message.saved', { file: fileName }), { kind: 'success' });
    return true;
  } catch (error) {
    if (!(error instanceof SaveCancelledError)) {
      showToast(t('message.saveFailed', { reason: errorReason(error) }), { kind: 'error' });
    }
    return false;
  }
}

export function setEdition(edition: Edition): void {
  session.edition = edition;
  remember();
}

// ---------- hero ----------

/**
 * Hero record offsets for the hero at `match` in the open save: from the header, or from the
 * selected edition when the header does not tell.
 */
function heroLayout(save: SaveGame, match: HeroMatch): HeroLayout {
  return heroLayoutAt(save.format, session.edition, save.buffer, match.position);
}

/** The found hero read with the current edition, or null. Reactive through `revision`. */
export function currentHero(): Hero | null {
  return readFoundHero('current');
}

/**
 * The found hero as in the file when it was opened, so the editor can show what changed,
 * even after "Apply" and after writing the file. Null when there is no hero.
 */
export function originalHero(): Hero | null {
  return readFoundHero('original');
}

/** Owners of the known heroes in the open save (null: free heroes), each at least once. */
export function heroOwnersInSave(): HeroOwner[] {
  return [...(session.heroNamesInSave?.values() ?? [])].flat();
}

/** Color of the player who owns the found hero; null when nobody does or nothing is found. */
export function currentHeroOwner(): HeroOwner {
  void session.revision;
  const { save, heroMatch } = session;
  return save && heroMatch ? readHeroOwner(save.buffer, heroMatch.position) : null;
}

/** The hero record at `position`, or null when it does not fit in the file. */
function readHeroOrNull(
  buffer: SaveBuffer,
  position: number,
  layout: HeroLayout,
  codePage: CodePage,
): Hero | null {
  try {
    return readHero(buffer, position, layout, codePage);
  } catch {
    return null;
  }
}

function readFoundHero(from: 'current' | 'original'): Hero | null {
  void session.revision;
  const { save, heroMatch } = session;
  return save && heroMatch
    ? readHeroOrNull(
        from === 'current' ? save.buffer : save.originalBuffer,
        heroMatch.position,
        heroLayout(save, heroMatch),
        heroMatch.codePage,
      )
    : null;
}

/** Raises the edition until the hero fits it, as the 2.05 version auto-detection did. */
function detectEdition(save: SaveGame, match: HeroMatch): void {
  const before = session.edition;
  for (let attempt = 0; attempt < EDITIONS.length; attempt += 1) {
    let hero: Hero;
    try {
      hero = readHero(save.buffer, match.position, heroLayout(save, match), match.codePage);
    } catch {
      // The raised edition moved the backpack past the end of the file: it was a false lead.
      session.edition = before;
      return;
    }
    const next = requiredEdition(hero, session.edition);
    if (!next) {
      break;
    }
    session.edition = next;
  }
  if (session.edition !== before) {
    session.editionAutoChanges += 1;
    remember();
    showToast(t('message.editionRaised', { edition: editionName(session.edition) }), {
      kind: 'warning',
    });
  }
}

/**
 * "Find hero": each call finds the next hero with the typed name and starts over from the top
 * after the last one. A new name starts from the top of the file.
 */
export function searchHero(): void {
  const save = session.save;
  const name = session.heroName.trim();
  if (!save) {
    return;
  }
  if (name === '') {
    showToast(t('message.heroNameRequired'), { kind: 'error' });
    return;
  }
  const previous = session.heroMatchName === name ? session.heroMatch : null;
  const match =
    (previous && findNextHero(save.buffer, name, previous)) ?? findHero(save.buffer, name);
  if (!match) {
    session.heroMatch = null;
    session.heroMatchName = null;
    showToast(t('message.heroNotFound'));
    return;
  }
  session.heroMatch = match;
  session.heroMatchName = name;
  detectEdition(save, match);
  session.revision += 1;
  if (!currentHero()) {
    showToast(t('message.heroUnreadable'), { kind: 'warning' });
  }
}

export function applyHero(hero: Hero): void {
  const { save, heroMatch } = session;
  if (!save || !heroMatch) {
    return;
  }
  const edited = {
    position: heroMatch.position,
    layout: heroLayout(save, heroMatch),
    codePage: heroMatch.codePage,
  };
  save.edit((buffer) => writeHero(buffer, edited.position, edited.layout, edited.codePage, hero));
  // The latest write tells how to read the record: the edition may have changed since.
  const index = session.edited.heroes.findIndex((known) => known.position === edited.position);
  session.edited.heroes.splice(index < 0 ? session.edited.heroes.length : index, 1, edited);
  session.heroName = hero.name;
  session.heroMatchName = hero.name.trim();
  // A rename adds the new name and may remove the old one.
  session.heroNamesInSave = findHeroNames(save.buffer, KNOWN_HERO_NAMES);
  session.revision += 1;
  showToast(t('message.heroChanged'), { kind: 'success' });
}

// ---------- resources ----------

export function currentResources(): ResourceAmounts | null {
  void session.revision;
  const { save, goldPosition } = session;
  return save && goldPosition !== null ? readResources(save.buffer, goldPosition) : null;
}

/** The typed search: gold and the ticked other resources. */
function resourceQuery(): ResourceQuery {
  const also: Partial<Record<OtherResource, number>> = {};
  for (const resource of OTHER_RESOURCES) {
    if (session.resourceFilters[resource].enabled) {
      also[resource] = session.resourceFilters[resource].amount;
    }
  }
  return { gold: session.goldQuery, also };
}

const queryKey = (query: ResourceQuery): string => JSON.stringify(query);

/**
 * "Find resources", like "Find hero": each call finds the next treasury that matches and starts
 * over from the top after the last one. A changed search starts from the top of the file.
 */
export function searchResources(): void {
  const save = session.save;
  if (!save) {
    return;
  }
  if (session.goldQuery < 1) {
    showToast(t('message.goldRequired'), { kind: 'error' });
    return;
  }
  const query = resourceQuery();
  const key = queryKey(query);
  const previous = session.goldMatchQuery === key ? session.goldPosition : null;
  const position =
    (previous === null ? null : findResources(save.buffer, query, previous + 1)) ??
    findResources(save.buffer, query);
  if (position === null) {
    session.goldPosition = null;
    session.goldMatchQuery = null;
    showToast(t('message.resourcesNotFound'));
    return;
  }
  session.goldPosition = position;
  session.goldMatchQuery = key;
  session.revision += 1;
}

/** The player whose treasury has its gold at `goldPosition`; null when it is not one of theirs. */
function treasuryColor(goldPosition: number | null): PlayerColor | null {
  const index =
    goldPosition === null ? -1 : (session.playerTreasuries?.indexOf(goldPosition) ?? -1);
  return PLAYER_COLORS[index] ?? null;
}

/**
 * The player whose treasury is shown, picked by color or found by amounts; null when nothing is
 * shown or the hit is not a player's treasury.
 */
export function shownTreasuryColor(): PlayerColor | null {
  return treasuryColor(session.goldPosition);
}

/** Like the other single-choice filters: a click shows the player's treasury, a second hides it. */
export function selectTreasuryByColor(color: PlayerColor): void {
  const position = session.playerTreasuries?.[PLAYER_COLORS.indexOf(color)];
  if (position === undefined) {
    return;
  }
  session.goldPosition = shownTreasuryColor() === color ? null : position;
  session.goldMatchQuery = null;
  session.revision += 1;
}

/** Players worth a color button: they own heroes in the save or have resources. */
export function playersWithTreasury(): PlayerColor[] {
  void session.revision;
  const { save, playerTreasuries } = session;
  if (!save || !playerTreasuries) {
    return [];
  }
  const owners = heroOwnersInSave();
  return PLAYER_COLORS.filter((color, index) => {
    const gold = playerTreasuries[index];
    const amounts = gold === undefined ? null : readResources(save.buffer, gold);
    return owners.includes(color) || RESOURCES.some((resource) => (amounts?.[resource] ?? 0) > 0);
  });
}

export function applyResources(amounts: ResourceAmounts): void {
  const { save, goldPosition } = session;
  if (!save || goldPosition === null) {
    return;
  }
  save.edit((buffer) => writeResources(buffer, goldPosition, amounts));
  if (!session.edited.treasuries.includes(goldPosition)) {
    session.edited.treasuries.push(goldPosition);
  }
  // The treasury now holds the new gold: search for that amount next time. A search that found
  // this treasury goes on from it, as if it had been made with the new gold.
  session.goldQuery = amounts.gold;
  if (session.goldMatchQuery !== null) {
    session.goldMatchQuery = queryKey(resourceQuery());
  }
  session.revision += 1;
  showToast(t('message.resourcesChanged'), { kind: 'success' });
}

export function hasUnsavedChanges(): boolean {
  void session.revision;
  return session.save?.hasUnsavedChanges ?? false;
}

// ---------- changes ----------

export interface TreasuryChanges {
  /** The player, when the treasury is one of the player block's; null otherwise. */
  color: PlayerColor | null;
  resources: ResourceChange[];
}

export interface EditedHeroChanges {
  name: string;
  classId: number;
  owner: HeroOwner;
  changes: HeroChanges;
}

/** Everything changed since the save was opened, for the info page. Reactive through `revision`. */
export function changeSummary(): { treasuries: TreasuryChanges[]; heroes: EditedHeroChanges[] } {
  void session.revision;
  const save = session.save;
  if (!save) {
    return { treasuries: [], heroes: [] };
  }
  const original = save.originalBuffer;
  const saved = save.savedBuffer;

  const treasuries = session.edited.treasuries.flatMap((gold) => {
    const before = readResources(original, gold);
    const after = readResources(save.buffer, gold);
    if (!before || !after) {
      return [];
    }
    const resources = resourceChanges(before, after, saved && readResources(saved, gold));
    return resources.length > 0 ? [{ color: treasuryColor(gold), resources }] : [];
  });

  const heroes = session.edited.heroes.flatMap(({ position, layout, codePage }) => {
    const read = (buffer: SaveBuffer): Hero | null =>
      readHeroOrNull(buffer, position, layout, codePage);
    const before = read(original);
    const after = read(save.buffer);
    if (!before || !after) {
      return [];
    }
    const changes = heroChanges(before, after, saved && read(saved));
    return hasHeroChanges(changes)
      ? [
          {
            name: after.name,
            classId: after.classId,
            owner: readHeroOwner(save.buffer, position),
            changes,
          },
        ]
      : [];
  });

  return { treasuries, heroes };
}
