'use strict';

/**
 * Colour maths for the contrast census. Written here (not in the page) so the
 * numbers the suite reports can be re-derived from the stored screenshots.
 */

/** WCAG 1.4.3 relative luminance from 0-255 sRGB channels. */
function relativeLuminance(r, g, b) {
  const channel = (value) => {
    const s = value / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Contrast ratio between two relative luminances. */
function contrast(l1, l2) {
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/** Parse `rgb(a, b, c)` / `rgba(a, b, c, d)` / `#rrggbb` into `{r,g,b,a}`. */
function parseColor(input) {
  const value = String(input || '').trim();
  const rgb = value.match(/rgba?\(([^)]+)\)/);
  if (rgb) {
    const parts = rgb[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: parts[0] || 0, g: parts[1] || 0, b: parts[2] || 0, a: parts.length > 3 ? parts[3] : 1 };
  }
  const hex = value.replace('#', '');
  if (/^[0-9a-f]{3,8}$/i.test(hex)) {
    const digits = hex.length <= 4 ? hex.split('').map((c) => c + c) : [hex.slice(0, 2), hex.slice(2, 4), hex.slice(4, 6), hex.length === 8 ? hex.slice(6, 8) : 'ff'];
    const [r, g, b, a] = digits.map((d) => parseInt(d, 16));
    return { r, g, b, a: a / 255 };
  }
  return null;
}

/** Composite a translucent ink over an opaque backdrop, WCAG-adjacent colours. */
function composite(ink, backdrop) {
  const alpha = ink.a === undefined ? 1 : ink.a;
  return {
    r: ink.r * alpha + backdrop.r * (1 - alpha),
    g: ink.g * alpha + backdrop.g * (1 - alpha),
    b: ink.b * alpha + backdrop.b * (1 - alpha),
    a: 1,
  };
}

function toHex({ r, g, b }) {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Normalise a pixel — `[r, g, b, a]` tuple or `{r,g,b}` — into a channel triple. */
function rgbOf(pixel) {
  if (Array.isArray(pixel)) return { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] === undefined ? 1 : pixel[3] };
  return pixel;
}

/**
 * Worst-case legibility of an ink over a sampled backdrop.
 *
 * Every glyph pixel sits on one backdrop pixel, so the honest WCAG reading is
 * the worst pairing, not the average one: a headline is unreadable if a tenth
 * of its field is blown out. The ink is composited over each sampled pixel
 * first, so translucent inks (`text-champagne/70`) are scored as they render.
 *
 * `tolerance` discards the worst N% of samples so a lone specular highlight or
 * a decorative hairline crossing the box cannot fail a node on its own.
 */
function worstCaseContrast(ink, pixels, { tolerance = 0.01 } = {}) {
  if (!pixels.length) return null;
  const inkL = relativeLuminance(ink.r, ink.g, ink.b);
  const ratios = new Array(pixels.length);
  for (let i = 0; i < pixels.length; i += 1) {
    const bg = rgbOf(pixels[i]);
    const blended = composite(ink, bg);
    ratios[i] = contrast(relativeLuminance(blended.r, blended.g, blended.b), relativeLuminance(bg.r, bg.g, bg.b));
  }
  ratios.sort((a, b) => a - b);
  const skip = Math.min(ratios.length - 1, Math.floor(ratios.length * tolerance));
  return {
    worst: ratios[skip],
    mean: ratios.reduce((sum, v) => sum + v, 0) / ratios.length,
    nominal: contrast(inkL, meanLuminance(pixels)),
  };
}

function meanLuminance(pixels) {
  if (!pixels.length) return 0;
  let sum = 0;
  for (const pixel of pixels) {
    const px = rgbOf(pixel);
    sum += relativeLuminance(px.r, px.g, px.b);
  }
  return sum / pixels.length;
}

/** WCAG size classes: large text is 24px+, or 18.66px+ at 700+. */
function isLargeText(fontSizePx, fontWeight) {
  const weight = Number(fontWeight) || (String(fontWeight).includes('bold') ? 700 : 400);
  return fontSizePx >= 24 || (fontSizePx >= 18.66 && weight >= 700);
}

module.exports = { relativeLuminance, contrast, parseColor, composite, toHex, worstCaseContrast, meanLuminance, isLargeText };
