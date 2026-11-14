/**
 * Writing the edited save back to disk. Chromium browsers can save straight to a file the user
 * picks (File System Access API); other browsers, and those that refuse to write to the picked
 * file, get a regular download.
 */

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: { description: string; accept: Record<string, string[]> }[];
}

interface WritableFileStream {
  write(data: BlobPart): Promise<void>;
  close(): Promise<void>;
}

interface SaveFileHandle {
  readonly name: string;
  createWritable(): Promise<WritableFileStream>;
}

type ShowSaveFilePicker = (options?: SaveFilePickerOptions) => Promise<SaveFileHandle>;

export const SAVE_FILE_EXTENSIONS = [
  '.cgm',
  '.gm1',
  '.gm2',
  '.gm3',
  '.gm4',
  '.gm5',
  '.gm6',
  '.gm7',
  '.gm8',
];

/** Thrown when the user closes the save dialog without picking a file. */
export class SaveCancelledError extends Error {
  constructor() {
    super('Saving was cancelled');
  }
}

function savePicker(): ShowSaveFilePicker | undefined {
  const candidate = (window as unknown as { showSaveFilePicker?: ShowSaveFilePicker })
    .showSaveFilePicker;
  return typeof candidate === 'function' ? candidate.bind(window) : undefined;
}

function download(bytes: Uint8Array, fileName: string): void {
  const url = URL.createObjectURL(
    new Blob([bytes as BlobPart], { type: 'application/octet-stream' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Saves the bytes and returns the file name actually used. */
export async function saveBytes(
  bytes: Uint8Array,
  suggestedName: string,
  description: string,
): Promise<string> {
  const picker = savePicker();
  if (!picker) {
    download(bytes, suggestedName);
    return suggestedName;
  }
  let handle: SaveFileHandle;
  try {
    const extension = /\.[^.]+$/.exec(suggestedName)?.[0]?.toLowerCase();
    const accept =
      extension && SAVE_FILE_EXTENSIONS.includes(extension) ? [extension] : SAVE_FILE_EXTENSIONS;
    handle = await picker({
      suggestedName,
      types: [{ description, accept: { 'application/octet-stream': accept } }],
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new SaveCancelledError();
    }
    throw error;
  }
  let writable: WritableFileStream;
  try {
    writable = await handle.createWritable();
  } catch (error) {
    // Some embedded browsers show the picker but refuse to write to the picked file.
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      download(bytes, handle.name);
      return handle.name;
    }
    throw error;
  }
  await writable.write(bytes as BlobPart);
  await writable.close();
  return handle.name;
}
