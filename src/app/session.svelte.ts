/**
 * The editing session: the opened save, the selected edition and the state of both searches.
 * Screens read `session` and change it only through the actions below.
 */

import { EDITIONS, isAvailableIn, type Edition } from '../data/editions';
import { requiredEdition } from '../core/editionDetection';
import { readHero, writeHero, type Hero } from '../core/hero';
import { findHero, findNextHero, type HeroMatch } from '../core/heroSearch';
import { heroLayoutAt, RESOURCES, type HeroLayout, type Resource } from '../core/layouts';
import {
  findResources,
  readResources,
  writeResources,
  type ResourceAmounts,
} from '../core/resources';
import { NotASaveError, SaveGame, editedFileName } from '../core/saveGame';
import { editionFromHeader, isEditingTested, minimumEditionFor } from '../core/saveFormat';
import { editionName } from '../i18n/game.svelte';
import { formatName } from '../ui/format';
import { t } from '../i18n/index.svelte';
import { readJson, writeJson } from '../storage/localStore';
import { SaveCancelledError, saveBytes } from './fileAccess';
import { showToast } from './toasts.svelte';

type OtherResource = Exclude<Resource, 'gold'>;

interface StoredSession {
  version: 1;
  edition: Edition;
  heroName: string;
}

const STORAGE_KEY = 'session';

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    candidate['version'] === 1 &&
    EDITIONS.includes(candidate['edition'] as Edition) &&
    typeof candidate['heroName'] === 'string'
  );
}

const stored = readJson<StoredSession>(
  STORAGE_KEY,
  { version: 1, edition: 'restorationOfErathia', heroName: '' },
  isStoredSession,
);

interface Session {
  /** Not reactive by itself: `revision` changes whenever the save is opened or edited. */
  save: SaveGame | null;
  revision: number;
  edition: Edition;
  /** Counts the times the editor changed the edition by itself, so the header can point it out. */
  editionAutoChanges: number;
  /** File name and time (ms since epoch) of the last successful save. */
  savedAs: { fileName: string; at: number } | null;
  heroName: string;
  heroMatch: HeroMatch | null;
  goldQuery: number;
  /** Other resources ticked to narrow the search, with their current amounts. */
  resourceFilters: Record<OtherResource, { enabled: boolean; amount: number }>;
  goldPosition: number | null;
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
  heroName: stored.heroName,
  heroMatch: null,
  goldQuery: 0,
  resourceFilters: emptyFilters(),
  goldPosition: null,
});

function remember(): void {
  writeJson(STORAGE_KEY, {
    version: 1,
    edition: session.edition,
    heroName: session.heroName,
  } satisfies StoredSession);
}

function errorReason(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// ---------- file ----------

export async function openSaveFile(file: File): Promise<void> {
  try {
    const save = await SaveGame.open(file.name, new Uint8Array(await file.arrayBuffer()));
    session.save = save;
    session.savedAs = null;
    session.heroMatch = null;
    session.goldPosition = null;
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
    const editCount = save.editCount;
    const packed = await save.pack();
    const suggested = session.savedAs?.fileName ?? editedFileName(save.fileName);
    const fileName = await saveBytes(packed, suggested, t('app.title'));
    save.markSaved(editCount);
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

function readFoundHero(from: 'current' | 'original'): Hero | null {
  void session.revision;
  const { save, heroMatch } = session;
  if (!save || !heroMatch) {
    return null;
  }
  try {
    return readHero(
      from === 'current' ? save.buffer : save.originalBuffer,
      heroMatch.position,
      heroLayout(save, heroMatch),
      heroMatch.codePage,
    );
  } catch {
    return null;
  }
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

export function searchHero(next: boolean): void {
  const save = session.save;
  const name = session.heroName.trim();
  if (!save) {
    return;
  }
  if (name === '') {
    showToast(t('message.heroNameRequired'), { kind: 'error' });
    return;
  }
  remember();
  const previous = session.heroMatch;
  const match =
    next && previous ? findNextHero(save.buffer, name, previous) : findHero(save.buffer, name);
  if (!match) {
    if (next && previous) {
      showToast(t('message.heroDone'));
    } else {
      session.heroMatch = null;
      showToast(t('message.heroNotFound'));
    }
    return;
  }
  session.heroMatch = match;
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
  save.edit((buffer) =>
    writeHero(buffer, heroMatch.position, heroLayout(save, heroMatch), heroMatch.codePage, hero),
  );
  session.heroName = hero.name;
  remember();
  session.revision += 1;
  showToast(t('message.heroChanged'), { kind: 'success' });
}

// ---------- resources ----------

export function currentResources(): ResourceAmounts | null {
  void session.revision;
  const { save, goldPosition } = session;
  return save && goldPosition !== null ? readResources(save.buffer, goldPosition) : null;
}

export function searchResources(next: boolean): void {
  const save = session.save;
  if (!save) {
    return;
  }
  if (session.goldQuery < 1) {
    showToast(t('message.goldRequired'), { kind: 'error' });
    return;
  }
  const also: Partial<Record<OtherResource, number>> = {};
  for (const resource of RESOURCES) {
    if (resource !== 'gold' && session.resourceFilters[resource].enabled) {
      also[resource] = session.resourceFilters[resource].amount;
    }
  }
  const previous = session.goldPosition;
  const from = next && previous !== null ? previous + 1 : 0;
  const position = findResources(save.buffer, { gold: session.goldQuery, also }, from);
  if (position === null) {
    if (next && previous !== null) {
      showToast(t('message.resourcesDone'));
    } else {
      session.goldPosition = null;
      showToast(t('message.resourcesNotFound'));
    }
    return;
  }
  session.goldPosition = position;
  session.revision += 1;
}

export function applyResources(amounts: ResourceAmounts): void {
  const { save, goldPosition } = session;
  if (!save || goldPosition === null) {
    return;
  }
  save.edit((buffer) => writeResources(buffer, goldPosition, amounts));
  // The treasury now holds the new gold: search for that amount next time.
  session.goldQuery = amounts.gold;
  session.revision += 1;
  showToast(t('message.resourcesChanged'), { kind: 'success' });
}

export function hasUnsavedChanges(): boolean {
  void session.revision;
  return session.save?.hasUnsavedChanges ?? false;
}
