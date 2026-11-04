/**
 * Heroes 3 saves are gzip files. The browser's own compression streams do the work,
 * so no compression library is needed.
 */

/** gzip magic number plus the deflate method byte: 1F 8B 08. */
const GZIP_SIGNATURE = [0x1f, 0x8b, 0x08] as const;

export function isGzip(bytes: Uint8Array): boolean {
  return GZIP_SIGNATURE.every((value, index) => bytes[index] === value);
}

async function pipe(bytes: Uint8Array, transform: GenericTransformStream): Promise<Uint8Array> {
  const source = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
  const reader = source.pipeThrough(transform).getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    const chunk = value as Uint8Array;
    chunks.push(chunk);
    total += chunk.length;
  }
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

const FLAG_HEADER_CRC = 0x02;
const FLAG_EXTRA = 0x04;
const FLAG_NAME = 0x08;
const FLAG_COMMENT = 0x10;
const HEADER_SIZE = 10;
const TRAILER_SIZE = 8;

/** Offset where the deflate data starts, after the optional header fields. */
function deflateStart(bytes: Uint8Array): number {
  const flags = bytes[3] ?? 0;
  let offset = HEADER_SIZE;
  if (flags & FLAG_EXTRA) {
    offset += 2 + ((bytes[offset] ?? 0) | ((bytes[offset + 1] ?? 0) << 8));
  }
  for (const flag of [FLAG_NAME, FLAG_COMMENT]) {
    if (flags & flag) {
      while (offset < bytes.length && bytes[offset] !== 0) {
        offset += 1;
      }
      offset += 1;
    }
  }
  if (flags & FLAG_HEADER_CRC) {
    offset += 2;
  }
  return offset;
}

/**
 * Heroes 3 writes a wrong CRC into the gzip trailer, so the browser's gzip decoder rejects
 * real saves. The header is skipped here and the deflate data is inflated on its own,
 * which ignores the trailer (CRC and length) completely.
 */
export function decompressGzip(bytes: Uint8Array): Promise<Uint8Array> {
  const start = deflateStart(bytes);
  const end = Math.max(start, bytes.length - TRAILER_SIZE);
  return pipe(bytes.subarray(start, end), new DecompressionStream('deflate-raw'));
}

export function compressGzip(bytes: Uint8Array): Promise<Uint8Array> {
  return pipe(bytes, new CompressionStream('gzip'));
}
