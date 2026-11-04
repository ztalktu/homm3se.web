/** An opened save: the unpacked bytes, what kind of game it is, and whether it was changed. */

import { compressGzip, decompressGzip, isGzip } from './gzip';
import { SaveBuffer } from './saveBuffer';
import { detectSaveFormat, type SaveFormat } from './saveFormat';

export type GameType =
  { kind: 'campaign' } | { kind: 'scenario'; players: number } | { kind: 'unknown' };

/** `.cgm` is a campaign, `.gm1`–`.gm8` a scenario for that many human players. */
export function gameTypeFromFileName(fileName: string): GameType {
  const extension = /\.([^.]+)$/.exec(fileName)?.[1]?.toLowerCase();
  if (extension === 'cgm') {
    return { kind: 'campaign' };
  }
  const players = extension ? /^gm([1-8])$/.exec(extension)?.[1] : undefined;
  return players ? { kind: 'scenario', players: Number(players) } : { kind: 'unknown' };
}

/** Default name for the edited copy, like the 2.05 editor: "se_" in front of the original name. */
export function editedFileName(fileName: string): string {
  return `se_${fileName}`;
}

export class NotASaveError extends Error {
  constructor(readonly fileName: string) {
    super(`${fileName} is not a Heroes 3 save (not a gzip file)`);
  }
}

export class SaveGame {
  readonly fileName: string;
  readonly gameType: GameType;
  readonly buffer: SaveBuffer;
  readonly format: SaveFormat;
  /** Edits so far, and how many of them the last written file contained. */
  private edits = 0;
  private savedEdits = 0;

  private constructor(fileName: string, unpacked: Uint8Array) {
    this.fileName = fileName;
    this.gameType = gameTypeFromFileName(fileName);
    this.buffer = new SaveBuffer(unpacked);
    this.format = detectSaveFormat(this.buffer);
  }

  /** Unpacks the file contents; throws NotASaveError if it is not gzip. */
  static async open(fileName: string, packed: Uint8Array): Promise<SaveGame> {
    if (!isGzip(packed)) {
      throw new NotASaveError(fileName);
    }
    let unpacked: Uint8Array;
    try {
      unpacked = await decompressGzip(packed);
    } catch {
      throw new NotASaveError(fileName);
    }
    return new SaveGame(fileName, unpacked);
  }

  /** For tests and tools: wraps already unpacked bytes. */
  static fromUnpacked(fileName: string, unpacked: Uint8Array): SaveGame {
    return new SaveGame(fileName, unpacked);
  }

  get hasUnsavedChanges(): boolean {
    return this.edits !== this.savedEdits;
  }

  /** Number of edits so far; pass the value taken before `pack` to `markSaved`. */
  get editCount(): number {
    return this.edits;
  }

  /** Runs an edit on the buffer and remembers that the save has changed. */
  edit(change: (buffer: SaveBuffer) => void): void {
    change(this.buffer);
    this.edits += 1;
  }

  /** Packs a snapshot of the current bytes into a gzip file the game can load. */
  async pack(): Promise<Uint8Array> {
    return compressGzip(this.buffer.bytes.slice());
  }

  /**
   * Call after the packed file has been written to disk, with the edit count taken before
   * packing: edits made while the save dialog was open are still unsaved.
   */
  markSaved(editCount = this.edits): void {
    this.savedEdits = editCount;
  }
}
