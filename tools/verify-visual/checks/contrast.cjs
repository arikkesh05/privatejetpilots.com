'use strict';

/**
 * AAA contrast census.
 *
 * Method (per scroll station):
 *   1. Collect every leaf node that paints ink, with its computed colour,
 *      opacity, size and box.
 *   2. Knock *all* ink out at once with `color: transparent !important` and take
 *      one full-viewport screenshot — that frame is the deck's true backdrop,
 *      including photography, WebGL and blend-mode washes that no computed
 *      style can express.
 *   3. Crop each node's own box out of that frame in Node and score the ink
 *      against every sampled backdrop pixel, compositing translucent inks first.
 *
 * The reported number is the worst ink/backdrop pairing in the node's box (with
 * a 1% outlier tolerance), which is the reading WCAG 1.4.3 asks for: a headline
 * is unreadable if a tenth of its field is blown out.
 */

const { collectTextNodes, paintInk, markHighlights } = require('../lib/page-probes.cjs');
const { captureViewport, cropToBox, pixelsOf } = require('../lib/screenshot.cjs');
const { parseColor, worstCaseContrast, isLargeText, toHex } = require('../lib/color.cjs');

/**
 * Scroll stations, each with a threshold profile. The static editorial
 * sections sit on opaque glass/substrate and must hold **AAA**; the cinematic
 * hero paints ink directly over full-bleed, continuously-painted frames, so its
 * legibility contract is **AA** (4.5:1 normal / 3:1 large) — the standard the
 * Band 3 brief names. Both profiles are hard gates.
 */
const STATIONS = [
  { selector: '#top', label: 'cinematic hero — cabin band', offset: 0, profile: 'hero' },
  { selector: '#fleet', label: 'fleet showcases', offset: -120, profile: 'surface' },
  { selector: '#concierge', label: 'concierge protocol', offset: -120, profile: 'surface' },
  { selector: 'footer', label: 'footer', offset: -160, profile: 'surface' },
];

/** Named nodes the directive cares about, reported individually. */
const HIGHLIGHTS = [
  { selector: '#fleet .editorial-frame span', label: 'photo caption over graded photography' },
  { selector: '[data-band="1"] h2', label: 'hero cabin headline' },
];

const PROFILES = {
  surface: { text: 7.0, largeText: 4.5, icon: 3.0, name: 'AAA' },
  hero: { text: 4.5, largeText: 3.0, icon: 3.0, name: 'AA' },
};

function thresholdFor(node, profile = PROFILES.surface) {
  if (node.isIcon) return { limit: profile.icon, kind: 'icon (1.4.11)' };
  const size = parseFloat(node.fontSize) || 16;
  if (isLargeText(size, node.fontWeight)) return { limit: profile.largeText, kind: `large text ${node.fontSize}` };
  return { limit: profile.text, kind: `normal text ${node.fontSize}` };
}

async function run(ctx) {
  const { page, outDir, deviceScaleFactor, report, fs, path } = ctx;

  for (const station of STATIONS) {
    const profile = PROFILES[station.profile];
    const exists = await page.evaluate((selector) => Boolean(document.querySelector(selector)), station.selector);
    if (!exists) {
      report.fail(`contrast station "${station.label}" — selector ${station.selector} is not in the document`);
      continue;
    }
    await ctx.session.scrollToSelector(page, station.selector, { offset: station.offset });

    const nodes = await page.evaluate(collectTextNodes);
    const inFrame = nodes.filter(
      (node) => node.box.y > 2 && node.box.y + node.box.height < ctx.session.VIEWPORT.height - 2 && node.effectiveOpacity > 0.02,
    );
    if (!inFrame.length) {
      report.warn(`contrast station "${station.label}" captured no ink-bearing nodes`);
      continue;
    }

    await ctx.captureFrame(`${station.selector.replace(/[^a-z]/gi, '')}-field`);

    const indices = inFrame.map((node) => node.index);
    /* The knockout has to *render* before the backdrop is photographed. Several
       deck nodes carry `transition-colors`, and a CSS transition means both the
       computed colour and the painted glyphs lag the inline declaration by its
       duration. Photographing that frame scores every node's own ink against
       itself and reports a nonsense worst case of 1:1 (mean reads a believable
       11:1 at the same time, which is how the defect hid). Transitions are
       suppressed for the duration of the capture and two frames are allowed to
       elapse before the shutter; the tag is then removed so the next station's
       field frame is recorded on the untouched deck. */
    const noTransition = await page.addStyleTag({ content: '*,*::before,*::after{transition:none !important}' });
    await page.evaluate(paintInk, { indices, visible: false });
    await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(true)))));
    const backdrop = await captureViewport(page);
    await page.evaluate(paintInk, { indices, visible: true });
    await noTransition.evaluate((node) => node.remove());

    for (const node of inFrame) {
      const crop = cropToBox(backdrop, node.box, deviceScaleFactor);
      if (!crop) continue;
      const ink = parseColor(node.colour);
      if (!ink) continue;
      ink.a *= node.effectiveOpacity;
      const score = worstCaseContrast(ink, pixelsOf(crop), { tolerance: ctx.aaaTolerance });
      if (!score) continue;

      const { limit, kind } = thresholdFor(node, profile);
      ctx.census.push({
        station: station.label,
        standard: profile.name,
        index: node.index,
        section: node.section,
        path: node.path,
        text: node.text,
        kind,
        isIcon: node.isIcon,
        ink: `${toHex(ink)} a${ink.a.toFixed(2)}`,
        size: node.fontSize,
        weight: node.fontWeight,
        family: node.fontFamily,
        worst: Number(score.worst.toFixed(2)),
        mean: Number(score.mean.toFixed(2)),
        limit,
        pass: score.worst >= limit,
      });
    }
  }

  const failures = ctx.census.filter((row) => !row.pass).sort((a, b) => a.worst - b.worst);
  const scored = ctx.census.length;

  if (path && fs) {
    fs.writeFileSync(path.join(outDir, 'contrast-census.json'), JSON.stringify(ctx.census, null, 2));
  }

  report.note(`${scored} ink-bearing nodes scored across ${STATIONS.length} scroll stations (worst-case pairing, ${ctx.aaaTolerance * 100}% outlier tolerance)`);

  const highlightSelectors = HIGHLIGHTS.map((highlight) => highlight.selector);
  const bySelector = await page.evaluate(markHighlights, highlightSelectors);
  for (const highlight of HIGHLIGHTS) {
    const indices = new Set(bySelector[highlight.selector] || []);
    const rows = ctx.census.filter((row) => indices.has(row.index));
    if (!rows.length) continue;
    const worst = rows.reduce((min, row) => (row.worst < min.worst ? row : min), rows[0]);
    report.note(`highlight — ${highlight.label}: worst ${worst.worst}:1 of ${rows.length} nodes (needs ${worst.limit}:1, ${worst.kind})`);
  }

  if (failures.length) {
    for (const row of failures.slice(0, 14)) {
      report.fail(
        `${row.standard} not met — ${row.section} ${row.kind} @ ${row.worst}:1 (needs ${row.limit}:1)`,
        { ink: row.ink, size: row.size, weight: row.weight, text: row.text, path: row.path.slice(0, 90) },
      );
    }
    if (failures.length > 14) report.fail(`…and ${failures.length - 14} further nodes below their standard`);
    return;
  }

  const worstText = ctx.census.filter((r) => !r.isIcon).reduce((min, r) => (r.worst < min.worst ? r : min), ctx.census[0]);
  report.pass(`contrast holds across all ${scored} text nodes — static surfaces AAA, cinematic hero AA; worst pairing ${worstText.worst}:1 (${worstText.section}, ${worstText.kind})`);
}

module.exports = { run, PROFILES, STATIONS };
