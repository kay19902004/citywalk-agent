import { readFileSync, writeFileSync } from "node:fs";
import { deflateSync, inflateSync } from "node:zlib";

function crc32(buffer) {
  const table = crc32.table ??= (() => {
    const values = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      values[n] = c >>> 0;
    }
    return values;
  })();

  let c = 0xffffffff;
  for (const byte of buffer) {
    c = table[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function readPng(path) {
  const bytes = readFileSync(path);
  if (bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
    throw new Error(`${path} is not a PNG`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idatChunks = [];

  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    offset += 4;
    const type = bytes.subarray(offset, offset + 4).toString("ascii");
    offset += 4;
    const data = bytes.subarray(offset, offset + length);
    offset += length + 4;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      idatChunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  if (bitDepth !== 8 || colorType !== 6) {
    throw new Error(`${path} must be 8-bit RGBA`);
  }

  const inflated = inflateSync(Buffer.concat(idatChunks));
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const rgba = Buffer.alloc(width * height * bytesPerPixel);
  let source = 0;
  let previousRow = Buffer.alloc(stride);

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[source];
    source += 1;
    const row = Buffer.from(inflated.subarray(source, source + stride));
    source += stride;

    for (let x = 0; x < stride; x += 1) {
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0;
      const up = previousRow[x];
      const upLeft = x >= bytesPerPixel ? previousRow[x - bytesPerPixel] : 0;
      let value = row[x];

      if (filter === 1) {
        value = (value + left) & 255;
      } else if (filter === 2) {
        value = (value + up) & 255;
      } else if (filter === 3) {
        value = (value + Math.floor((left + up) / 2)) & 255;
      } else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
        value = (value + predictor) & 255;
      } else if (filter !== 0) {
        throw new Error(`Unsupported PNG filter ${filter}`);
      }

      row[x] = value;
    }

    row.copy(rgba, y * stride);
    previousRow = row;
  }

  return { width, height, rgba };
}

function writePng(path, width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const source = y * width * 4;
    const target = y * (width * 4 + 1);
    raw[target] = 0;
    rgba.copy(raw, target + 1, source, source + width * 4);
  }

  const chunks = [];
  const addChunk = (type, data) => {
    const typeBuffer = Buffer.from(type, "ascii");
    const length = Buffer.alloc(4);
    const crc = Buffer.alloc(4);
    length.writeUInt32BE(data.length);
    crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
    chunks.push(length, typeBuffer, data, crc);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  addChunk("IHDR", ihdr);
  addChunk("IDAT", deflateSync(raw, { level: 9 }));
  addChunk("IEND", Buffer.alloc(0));

  writeFileSync(path, Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), ...chunks]));
}

function cleanConnectedChecker(input, output) {
  const { width, height, rgba } = readPng(input);
  const pixelCount = width * height;
  const visited = new Uint8Array(pixelCount);
  const queue = new Int32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const isEdgeMatte = (index) => {
    const offset = index * 4;
    const r = rgba[offset];
    const g = rgba[offset + 1];
    const b = rgba[offset + 2];
    const a = rgba[offset + 3];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const average = (r + g + b) / 3;

    return a < 48 || (a > 180 && average > 216 && max - min < 34);
  };

  const push = (index) => {
    if (index < 0 || index >= pixelCount || visited[index] || !isEdgeMatte(index)) {
      return;
    }
    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) push(index - 1);
    if (x + 1 < width) push(index + 1);
    if (y > 0) push(index - width);
    if (y + 1 < height) push(index + width);
  }

  for (let index = 0; index < pixelCount; index += 1) {
    const offset = index * 4;
    const r = rgba[offset];
    const g = rgba[offset + 1];
    const b = rgba[offset + 2];
    const a = rgba[offset + 3];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const average = (r + g + b) / 3;
    const isResidualMatte = a < 190 && average > 168 && max - min < 54;

    if (!visited[index] && !isResidualMatte) {
      continue;
    }

    rgba[offset] = 255;
    rgba[offset + 1] = 255;
    rgba[offset + 2] = 255;
    rgba[offset + 3] = 0;
  }

  writePng(output, width, height, rgba);
  return `${output} cleared ${tail} matte pixels`;
}

const base = new URL("../public/assets/citywalk-art-assets-transparent/", import.meta.url);
const outputs = [
  cleanConnectedChecker(new URL("cta-shoe-map-left.png", base), new URL("cta-shoe-map-left-clean.png", base)),
  cleanConnectedChecker(new URL("cta-compass-ticket-right.png", base), new URL("cta-compass-ticket-right-clean.png", base))
];

console.log(outputs.join("\n"));
