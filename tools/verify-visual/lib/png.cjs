'use strict';

/**
 * Minimal PNG decoder (8-bit, non-interlaced, grey/RGB/RGBA).
 *
 * Rendered pixels are the only evidence that exists for photography and WebGL
 * shading, so the suite decodes its own screenshots in Node instead of shipping
 * them to an image viewer nobody can read.
 */

const fs = require('node:fs');
const zlib = require('node:zlib');

const SIGNATURE = 0x89504e47;

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decodePng(source) {
  const buf = Buffer.isBuffer(source) ? source : fs.readFileSync(source);
  if (buf.readUInt32BE(0) !== SIGNATURE) throw new Error('not a png');

  let offset = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  let bitDepth = 0;
  let interlace = 0;
  const idat = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    const chunk = buf.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8];
      colorType = chunk[9];
      interlace = chunk[12];
    } else if (type === 'IDAT') {
      idat.push(chunk);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }

  if (bitDepth !== 8 || interlace !== 0) {
    throw new Error(`unsupported png depth=${bitDepth} interlace=${interlace}`);
  }

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : colorType === 4 ? 2 : 0;
  if (!channels) throw new Error(`unsupported colorType ${colorType}`);

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride);
    const current = out.subarray(y * stride, (y + 1) * stride);
    const previous = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;

    for (let x = 0; x < stride; x += 1) {
      const a = x >= channels ? current[x - channels] : 0;
      const b = previous ? previous[x] : 0;
      const c = previous && x >= channels ? previous[x - channels] : 0;
      const value = line[x];
      let decoded;
      if (filter === 0) decoded = value;
      else if (filter === 1) decoded = value + a;
      else if (filter === 2) decoded = value + b;
      else if (filter === 3) decoded = value + ((a + b) >> 1);
      else if (filter === 4) decoded = value + paeth(a, b, c);
      else throw new Error(`bad filter ${filter}`);
      current[x] = decoded & 0xff;
    }
  }

  return { width, height, channels, data: out };
}

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    table[index] = value;
  }
  return table;
})();

function crc32(buffer) {
  let crc = -1;
  for (let index = 0; index < buffer.length; index += 1) crc = CRC_TABLE[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([length, body, crc]);
}

/** Encode an RGBA/RGB image back to PNG so cropped regions can be filed as evidence. */
function encodePng(image) {
  const { width, height, channels, data } = image;
  const colorType = channels === 4 ? 6 : 3;
  const stride = width * channels;
  const raw = Buffer.alloc(height * (stride + 1));
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * Pixel-level difference between two frames of the same size, used to prove that
 * a state transition actually moved pixels rather than only classes.
 */
function diffStats(before, after, { threshold = 8 } = {}) {
  if (!before || !after) return { changedRatio: 0, maxDelta: 0, sameSize: false };
  const sameSize = before.width === after.width && before.height === after.height;
  if (!sameSize) return { changedRatio: 0, maxDelta: 0, sameSize };

  const beforeStride = before.stride || before.width * before.channels;
  const afterStride = after.stride || after.width * after.channels;
  let changed = 0;
  let maxDelta = 0;
  let total = 0;
  for (let y = 0; y < before.height; y += 1) {
    for (let x = 0; x < before.width; x += 1) {
      let delta = 0;
      for (let channel = 0; channel < 3; channel += 1) {
        const a = before.data[y * beforeStride + x * before.channels + channel];
        const b = after.data[y * afterStride + x * after.channels + channel];
        delta = Math.max(delta, Math.abs(a - b));
      }
      total += 1;
      if (delta > threshold) changed += 1;
      maxDelta = Math.max(maxDelta, delta);
    }
  }
  return { changedRatio: total ? changed / total : 0, maxDelta, sameSize: true };
}

module.exports = { decodePng, encodePng, diffStats };

