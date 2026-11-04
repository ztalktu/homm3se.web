/**
 * The unpacked save file in memory. All numbers in a Heroes 3 save are little-endian.
 * Reads outside the buffer return undefined instead of throwing, because the editor
 * looks at offsets around search hits that may fall off either end of the file.
 */

/** Value the game uses for "nothing here" in 32-bit slots (empty army slot, empty backpack slot). */
export const EMPTY_SLOT = 0xffffffff;

export class SaveBuffer {
  readonly bytes: Uint8Array;
  private readonly view: DataView;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }

  get length(): number {
    return this.bytes.length;
  }

  contains(offset: number, size: number): boolean {
    return Number.isInteger(offset) && offset >= 0 && offset + size <= this.bytes.length;
  }

  readU8(offset: number): number | undefined {
    return this.contains(offset, 1) ? this.view.getUint8(offset) : undefined;
  }

  readU16(offset: number): number | undefined {
    return this.contains(offset, 2) ? this.view.getUint16(offset, true) : undefined;
  }

  readU32(offset: number): number | undefined {
    return this.contains(offset, 4) ? this.view.getUint32(offset, true) : undefined;
  }

  writeU8(offset: number, value: number): void {
    this.assertRange(offset, 1);
    this.view.setUint8(offset, value);
  }

  writeU16(offset: number, value: number): void {
    this.assertRange(offset, 2);
    this.view.setUint16(offset, value, true);
  }

  writeU32(offset: number, value: number): void {
    this.assertRange(offset, 4);
    this.view.setUint32(offset, value >>> 0, true);
  }

  writeBytes(offset: number, values: Uint8Array): void {
    this.assertRange(offset, values.length);
    this.bytes.set(values, offset);
  }

  /** Offset of the first occurrence of `pattern` at or after `from`, or null. */
  indexOf(pattern: Uint8Array, from = 0): number | null {
    const first = pattern[0];
    if (first === undefined) {
      return null;
    }
    const last = this.bytes.length - pattern.length;
    for (let offset = Math.max(0, from); offset <= last; offset += 1) {
      if (this.bytes[offset] !== first) {
        continue;
      }
      let matches = true;
      for (let index = 1; index < pattern.length; index += 1) {
        if (this.bytes[offset + index] !== pattern[index]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        return offset;
      }
    }
    return null;
  }

  private assertRange(offset: number, size: number): void {
    if (!this.contains(offset, size)) {
      throw new RangeError(`Write of ${size} bytes at ${offset} is outside the save file`);
    }
  }
}

export function u32LittleEndian(value: number): Uint8Array {
  const bytes = new Uint8Array(4);
  new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
  return bytes;
}
