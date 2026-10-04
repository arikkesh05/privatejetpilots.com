'use strict';

/**
 * Rendered-pixel grade metrics (promoted from the scratch pixel audit).
 *
 * Token sweeps and class audits cannot see chroma: a photograph graded violet
 * and a WebGL rim light that reads cool both survived every DOM-level check
 * this project has run. These metrics look at the pixels that actually shipped.
 */

/**
 * @param {{width:number,height:number,channels:number,data:Buffer}} image
 * @param {{coolMargin?:number, bucketBits?:number}} [options]
 */
function gradeMetrics(image, options = {}) {
  const { width, height, channels, data } = image;
  const coolMargin = options.coolMargin ?? 25;
  const bits = options.bucketBits ?? 5;

  const buckets = new Map();
  const coolColumns = [];
  const coolRows = [];
  let coolCast = 0;
  let pureWhite = 0;
  let saturatedGold = 0;
  let lit = 0;
  let total = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    total += 1;
    sumR += r;
    sumG += g;
    sumB += b;

    const key = `${r >> bits}-${g >> bits}-${b >> bits}`;
    buckets.set(key, (buckets.get(key) || 0) + 1);

    if (b > Math.max(r, g) + coolMargin) {
      coolCast += 1;
      const index = i / channels;
      coolColumns.push(index % width);
      coolRows.push(Math.floor(index / width));
    }
    if (r > 245 && g > 245 && b > 245) pureWhite += 1;
    if (r > 205 && g > 170 && b < 130) saturatedGold += 1;
    if (r + g + b > 240) lit += 1;
  }

  const percent = (value) => (value / total) * 100;
  const top = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, count]) => {
      const [r, g, b] = key.split('-').map(Number);
      const hex = '#' + [r, g, b].map((q) => (q * 32 + 16).toString(16).padStart(2, '0')).join('');
      return { hex, share: percent(count) };
    });

  const box = coolColumns.length
    ? (() => {
        const scale = width / (options.cssWidth || width);
        const min = (list) => Math.min(...list);
        const max = (list) => Math.max(...list);
        return {
          x0: Math.round(min(coolColumns) * scale),
          x1: Math.round(max(coolColumns) * scale),
          y0: Math.round(min(coolRows) * scale),
          y1: Math.round(max(coolRows) * scale),
        };
      })()
    : null;

  return {
    width,
    height,
    mean: { r: Math.floor(sumR / total), g: Math.floor(sumG / total), b: Math.floor(sumB / total) },
    coolCastPercent: percent(coolCast),
    pureWhitePercent: percent(pureWhite),
    saturatedGoldPercent: percent(saturatedGold),
    litPercent: percent(lit),
    top,
    coolBox: box,
  };
}

/**
 * LCD subpixel antialiasing fringes the blue channel at glyph edges. Re-running
 * the cool test at a wide channel margin separates that fringe (+60 collapses
 * it) from genuine chroma (which does not).
 */
function coolCastAtMargins(image, margins = [25, 60]) {
  const out = {};
  for (const margin of margins) out[`+${margin}`] = Number(gradeMetrics(image, { coolMargin: margin }).coolCastPercent.toFixed(4));
  return out;
}

module.exports = { gradeMetrics, coolCastAtMargins };
