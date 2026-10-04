'use strict';

/**
 * Viewport capture and cropping.
 *
 * Region sampling crops a single full-viewport screenshot in Node rather than
 * calling `page.screenshot({ clip })` per node: a full-viewport shot always maps
 * 1:1 onto `getBoundingClientRect() x devicePixelRatio`, so no viewport-versus-
 * document clip convention has to be trusted, and one hundred and eighty nodes
 * cost three screenshots instead of one hundred and eighty.
 */

const { decodePng, encodePng } = require('./png.cjs');

/**
 * Capture the current viewport. The buffer is decoded immediately because every
 * downstream check (contrast, grade, diff) needs pixels rather than a file.
 *
 * Animations are left alone on purpose: `animations: 'disabled'` would cancel
 * time-based motion to its end state, which would erase exactly the reveal
 * progress the motion check exists to observe. Stability comes from settling in
 * `session.settle` instead.
 */
async function captureViewport(page, name = null, options = {}) {
  const { outDir = null, fs = null, path = null, deviceScaleFactor = 1, write = true } = options;
  const buffer = await page.screenshot({ type: 'png', timeout: 60000 });
  const target = name && outDir && path && fs ? path.join(outDir, `${name}.png`) : null;
  if (write && target) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(target, buffer);
  }
  const image = decodePng(buffer);
  image.deviceScaleFactor = deviceScaleFactor;
  return image;
}

/** Cut a node box out of a decoded viewport screenshot, in device pixels. */
function cropToBox(image, box, deviceScaleFactor = image.deviceScaleFactor || 2) {
  const x0 = Math.max(0, Math.round(box.x * deviceScaleFactor));
  const y0 = Math.max(0, Math.round(box.y * deviceScaleFactor));
  const x1 = Math.min(image.width, Math.round((box.x + box.width) * deviceScaleFactor));
  const y1 = Math.min(image.height, Math.round((box.y + box.height) * deviceScaleFactor));
  const width = x1 - x0;
  const height = y1 - y0;
  // A box with no measurable geometry — a node caught mid-transition, inside a clip,
  // or removed before the screenshot — produces NaN bounds. Reject it here rather
  // than let Buffer.alloc(NaN) take the whole run down.
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 2 || height < 2) return null;


  const { channels, data } = image;
  const sourceStride = image.width * channels;
  const out = Buffer.alloc(width * height * channels);
  for (let row = 0; row < height; row += 1) {
    const from = (y0 + row) * sourceStride + x0 * channels;
    data.copy(out, row * width * channels, from, from + width * channels);
  }
  return { width, height, channels, stride: width * channels, data: out, deviceScaleFactor };
}

/**
 * Every pixel of a decoded image as [r, g, b, a] tuples, thinned for speed.
 * Thinning keeps the worst-case sampling honest: 24k samples across a text box
 * still resolve the p99 outlier band that the contrast maths discards.
 */
function pixelsOf(image, { maxPixels = 24000 } = {}) {
  const { width, height, channels, data } = image;
  const total = width * height;
  const step = Math.max(1, Math.ceil(total / maxPixels));
  const pixels = [];
  for (let index = 0; index < total; index += step) {
    const offset = index * channels;
    const alpha = channels === 4 ? data[offset + 3] : 255;
    if (alpha < 8) continue;
    pixels.push([data[offset], data[offset + 1], data[offset + 2], alpha / 255]);
  }
  return pixels;
}

/**
 * Capture an element-sized region.
 *
 * Deliberately a viewport shot cropped in Node rather than Playwright's `clip`,
 * because `clip` interacts with page scroll — precisely the quantity the pinned
 * hero check manipulates. Cropping a known-good viewport frame keeps the
 * coordinate space unambiguous: CSS pixels relative to the viewport, which is
 * exactly the space `getBoundingClientRect()` reports.
 */
async function captureNode(page, box, name, options = {}) {
  const { outDir, fs, path, deviceScaleFactor = 1 } = options;
  if (!box || box.width < 2 || box.height < 2) return null;
  const frame = await captureViewport(page, name, { outDir, fs, path, deviceScaleFactor, write: false });
  const crop = cropToBox(frame, box, deviceScaleFactor);
  if (!crop) return null;
  if (outDir && path && fs) fs.writeFileSync(path.join(outDir, `${name}.png`), encodePng(crop));
  return crop;
}

/** Capture the focused element's region, to prove the focus ring resolves. */
async function captureFocus(page, options = {}) {
  const box = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
  if (!box) return null;
  return captureNode(page, box, options.name || 'focus-ring', options);
}

/** Capture the viewport and record it in the run's frame ledger. */
async function captureFrame(ctx, name, { kind = 'frame', write = true } = {}) {
  const image = await captureViewport(ctx.page, name, {
    outDir: ctx.outDir,
    fs: ctx.fs,
    path: ctx.path,
    deviceScaleFactor: ctx.deviceScaleFactor,
    write,
  });
  ctx.frames.push({ name, kind, image });
  return image;
}

module.exports = { captureViewport, captureNode, captureFocus, captureFrame, cropToBox, pixelsOf };
