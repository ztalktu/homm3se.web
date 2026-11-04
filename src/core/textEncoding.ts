/**
 * Hero names are stored in the code page of the game installation:
 * windows-1251 for Russian games, windows-1252 for English ones.
 * Browsers decode both, but TextEncoder only writes UTF-8, so the encode tables
 * are built once from the decoder.
 */

export type CodePage = 'windows-1251' | 'windows-1252';

const encodeTables = new Map<CodePage, Map<string, number>>();

function encodeTable(codePage: CodePage): Map<string, number> {
  let table = encodeTables.get(codePage);
  if (!table) {
    table = new Map();
    const decoder = new TextDecoder(codePage);
    for (let byte = 0; byte < 256; byte += 1) {
      const character = decoder.decode(new Uint8Array([byte]));
      // Undefined bytes decode to U+FFFD; keep the first mapping for each character.
      if (character !== '�' && !table.has(character)) {
        table.set(character, byte);
      }
    }
    encodeTables.set(codePage, table);
  }
  return table;
}

/** Encodes text in the code page, or returns null if some character does not exist there. */
export function encodeText(text: string, codePage: CodePage): Uint8Array | null {
  const table = encodeTable(codePage);
  const bytes = new Uint8Array(text.length);
  let index = 0;
  for (const character of text) {
    const byte = table.get(character);
    if (byte === undefined) {
      return null;
    }
    bytes[index] = byte;
    index += 1;
  }
  return bytes.subarray(0, index);
}

export function decodeText(bytes: Uint8Array, codePage: CodePage): string {
  return new TextDecoder(codePage).decode(bytes);
}

/** Code pages to try for a name, most likely first: Cyrillic text can only be Russian. */
export function codePagesFor(name: string): CodePage[] {
  return /[Ѐ-ӿ]/.test(name) ? ['windows-1251'] : ['windows-1252', 'windows-1251'];
}
