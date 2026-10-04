'use strict';

/**
 * SCROLLER — the pinned canvas-scrubber hero contract (`JetCanvasScroller`).
 *
 * The hero is a 158-frame cabin-to-sky push sequence drawn to one full-bleed
 * `<canvas>` while a GSAP ScrollTrigger pins one viewport and scrubs a frame
 * index plus three editorial bands across a 500vh track. This check drives the
 * track, samples three stations, and demands each mechanism actually works: the
 * frame canvas repaints, the bands choreograph and carry the current PJP copy,
 * the Band 2 backplate and Band 3 shadow treatments are really applied, the
 * floating nav is high-density glass, and the `.fleet-card` grid is present. It
 * also measures Band 3's worst-case contrast against real pixels — the brief
 * lifts it past AA.
 */

const { collectScroller, collectTextNodes, paintInk } = require('../lib/page-probes.cjs');
const { captureViewport, cropToBox, pixelsOf } = require('../lib/screenshot.cjs');
const { parseColor, worstCaseContrast, isLargeText } = require('../lib/color.cjs');
const { diffStats } = require('../lib/png.cjs');

/** Track stations as a fraction of the pinned scroll range. */
const SAMPLE_POINTS = { band1: 0.05, band2: 0.5, band3: 0.85 };

/** Drive the pinned hero track to a fraction of its scrollable range. */
async function scrollHeroTo(page, fraction) {
  await page.evaluate((f) => {
    const track = document.querySelector('[data-band="1"]').closest('section');
    const range = Math.max(0, track.offsetHeight - window.innerHeight);
    const y = track.getBoundingClientRect().top + window.scrollY + range * f;
    window.scrollTo(0, y);
    window.dispatchEvent(new Event('scroll'));
  }, fraction);
  await page.waitForTimeout(1600);
}

/** Worst-case ink/backdrop contrast of the visible node whose text matches. */
async function worstContrast(page, target, deviceScaleFactor) {
  const nodes = await page.evaluate(collectTextNodes);
  const inFrame = nodes.filter((node) => node.text.includes(target) && node.effectiveOpacity > 0.02);
  if (!inFrame.length) return null;
  const indices = inFrame.map((node) => node.index);
  /* Same two requirements as the contrast census: the knockout must actually
     render before the shutter (the deck transitions `color`), and the crop has
     to be cut at the session's real device pixel ratio — the viewport is
     captured at `deviceScaleFactor` device pixels per CSS pixel, so cropping a
     node's CSS box at 1:1 would read the wrong region of the frame entirely. */
  const noTransition = await page.addStyleTag({ content: '*,*::before,*::after{transition:none !important}' });
  await page.evaluate(paintInk, { indices, visible: false });
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(true)))));
  const backdrop = await captureViewport(page, null, { deviceScaleFactor });
  await page.evaluate(paintInk, { indices, visible: true });
  await noTransition.evaluate((node) => node.remove());

  let worst = Infinity;
  let sample = null;
  for (const node of inFrame) {
    const crop = cropToBox(backdrop, node.box, deviceScaleFactor);
    if (!crop) continue;
    const ink = parseColor(node.colour);
    if (!ink) continue;
    ink.a *= node.effectiveOpacity;
    const score = worstCaseContrast(ink, pixelsOf(crop), { tolerance: 0.01 });
    if (!score) continue;
    if (score.worst < worst) {
      worst = score.worst;
      sample = node;
    }
  }
  if (!sample) return null;
  const size = Number.parseFloat(sample.fontSize) || 16;
  const large = isLargeText(size, sample.fontWeight);
  return { worst: Number(worst.toFixed(2)), limit: large ? 3.0 : 4.5, large, text: sample.text };
}

async function run(ctx) {
  const { page, report } = ctx;
  const vh = ctx.session.VIEWPORT.height;

  await page.evaluate(() => window.scrollTo(0, 0));
  await ctx.session.settleFonts(page);

  const atTop = await page.evaluate(collectScroller);
  if (!atTop.present) {
    report.fail('canvas-scroller hero missing — no [data-band] track or <canvas> in the document');
    return;
  }

  const trackViewports = atTop.trackHeight / vh;
  if (trackViewports < 4.9 || trackViewports > 5.1) {
    report.fail('hero track is not the 500vh the pin reserves', { trackHeight: atTop.trackHeight, viewports: Number(trackViewports.toFixed(2)) });
  } else {
    report.pass(`hero track reserves ${trackViewports.toFixed(2)} viewports (500vh)`);
  }
  if (!atTop.canvas || atTop.canvas.width < vh * 0.8 || atTop.canvas.height < vh * 0.8) {
    report.fail('hero canvas missing or degenerate', atTop.canvas);
  } else {
    report.pass(`frame canvas mounted at ${atTop.canvas.width}×${atTop.canvas.height} CSS px`);
  }

  if (atTop.nav && atTop.nav.background === 'rgba(0, 0, 0, 0.6)' && /blur\(24px\)/.test(atTop.nav.backdrop || '')) {
    report.pass('floating nav renders high-density glass (rgba(0,0,0,0.6) / blur(24px))');
  } else {
    report.fail('floating nav glass does not resolve', atTop.nav);
  }
  if (atTop.fleetCards === 3) report.pass('fleet grid renders three .fleet-card showcases');
  else report.fail('expected three .fleet-card showcases', { fleetCards: atTop.fleetCards });

  await scrollHeroTo(page, SAMPLE_POINTS.band1);
  const band1 = await page.evaluate(collectScroller);
  const band1copy = band1.copy.band1 || '';
  if (band1.bands[1].opacity > 0.9 && band1.bands[2].opacity < 0.05 && band1copy.includes('Unrestricted') && band1copy.includes('GLOBAL TELEMETRY') && band1copy.includes('15 MIN CONFIRMATION')) {
    report.pass('Band 1 composes "Unrestricted Global Reach" + telemetry sub-label + dispatch/global metadata rail at p=0.05');
  } else {
    report.fail('Band 1 is missing, mis-copied or mis-choreographed', { copy: band1copy, opacity: band1.bands[1].opacity });
  }
  const frameA = await captureViewport(page, null, { deviceScaleFactor: 1 });

  await scrollHeroTo(page, SAMPLE_POINTS.band2);
  const band2 = await page.evaluate(collectScroller);
  const band2copy = band2.copy.band2 || '';
  if (band2.bands[2].opacity > 0.9 && band2.bands[1].opacity < 0.05 && band2copy.includes('Bespoke In') && band2copy.includes('CABIN ARCHITECTURE') && band2copy.includes('DUAL-COMMAND ATP PILOTS')) {
    report.pass('Band 2 composes "Bespoke In Every Detail" + PHASE 02 // CABIN ARCHITECTURE + crew/acoustics rail at p=0.50');
  } else {
    report.fail('Band 2 is missing, mis-copied or mis-choreographed', { copy: band2copy, opacity: band2.bands[2].opacity });
  }
  if (Math.abs(band2.viewportTop) <= 2) report.pass('hero viewport stays pinned at p=0.50 (top 0)');
  else report.fail('hero viewport drifted off the pin', { viewportTop: band2.viewportTop });

  /* The editorial plate is deliberately flatter than the old frosted card: a
     gradient scrim for AA, a blur to separate it from the frame, and a soft
     radius. It carries no `filter` drop-shadow any more — the ink does that
     work itself via `frame-ink-strong`. Requiring a shadow here would pin the
     check to a treatment this design deliberately abandoned. */
  const plate = band2.band2Backplate;
  const plateOk = plate && /linear-gradient/.test(plate.backgroundImage) && /blur\(4px\)/.test(plate.backdropFilter || '') && plate.borderRadius === '16px';
  if (plateOk) report.pass('Band 2 backplate applies the gradient scrim + blur(4px) + rounded-2xl');
  else report.fail('Band 2 backplate treatment is not fully applied', plate);

  const frameB = await captureViewport(page, null, { deviceScaleFactor: 1 });
  const scrubDelta = diffStats(frameA, frameB).changedRatio;
  if (scrubDelta > 0.05) report.pass(`frame canvas repaints across the scrub (${(scrubDelta * 100).toFixed(1)}% of pixels changed 0.05→0.50)`);
  else report.fail('frame canvas did not repaint across the scrub — the sequence is frozen', { changedRatio: scrubDelta });

  await scrollHeroTo(page, SAMPLE_POINTS.band3);
  const band3 = await page.evaluate(collectScroller);
  const band3copy = band3.copy.band3 || '';
  if (band3.bands[3].opacity > 0.9 && band3copy.includes('Absolute') && band3copy.includes('Silence.') && band3copy.includes('Pure') && band3copy.includes('Focus.')) {
    report.pass('Band 3 composes split "Absolute Silence." / "Pure Focus." at p=0.85');
  } else {
    report.fail('Band 3 is missing or mis-copied', { copy: band3copy, opacity: band3.bands[3].opacity });
  }
  if (band3copy.includes('7,700 NM') && band3copy.includes('Mach 0.925') && band3copy.includes('3,000 FT')) {
    report.pass('Band 3 carries the bottom telemetry rail (range / cruise / air / cabin alt)');
  } else {
    report.fail('Band 3 telemetry rail is missing or mis-copied', { copy: band3copy });
  }

  /* Split framing exists to keep the cockpit perspective readable, so the
     centre corridor must genuinely be clear: neither flank title may cross the
     middle 40% of the width. A centred headline would pass the copy assertion
     above while quietly destroying the composition this layout exists for. */
  /* `leftEdge` / `rightEdge` are both *positive* when the flanks stay clear of
     the centre line, each being the distance in CSS px from the viewport
     midpoint to the nearer title edge. So the corridor is clear when BOTH
     exceed the minimum. (An earlier version compared `rightEdge > -CLEAR`,
     which is only true for an encroaching layout and inverted the result.) */
  const corridor = band3.band3Corridor;
  const CLEAR = 30; // CSS px of clearance required on each side of centre
  if (corridor && corridor.leftEdge >= CLEAR && corridor.rightEdge >= CLEAR) {
    report.pass(`Band 3 leaves the centre corridor clear — ${Math.round(corridor.leftEdge)}px each side of the midpoint (${Math.round(corridor.leftEdge * 2)}px total)`);
  } else {
    report.fail('Band 3 flank titles encroach on the centre corridor', corridor);
  }

  const shadow = band3.band3Shadow;
  const layered = (value) => (value ? (value.match(/drop-shadow/g) || []).length : 0);
  if (layered(shadow.titleFilter) >= 2 && layered(shadow.subFilter) >= 2) {
    report.pass('Band 3 title and subtitle carry multi-layered drop shadows');
  } else {
    report.fail('Band 3 is missing its multi-layer drop shadow treatment', shadow);
  }

  /* Match against `textContent`, which is the raw DOM casing — the telemetry
     rail renders uppercase through CSS (`text-transform`), so 'CRUISE' is not
     in the node text and matching it here would silently return null. */
  const title = await worstContrast(page, 'Absolute', ctx.deviceScaleFactor);
  const sub = await worstContrast(page, 'Cruise', ctx.deviceScaleFactor);
  if (title && title.worst >= title.limit) report.pass(`Band 3 title clears AA over live pixels — ${title.worst}:1 (needs ${title.limit}:1)`);
  else report.fail('Band 3 title is below AA over live pixels', title);
  if (sub && sub.worst >= sub.limit) report.pass(`Band 3 telemetry rail clears AA over live pixels — ${sub.worst}:1 (needs ${sub.limit}:1)`);
  else report.fail('Band 3 telemetry rail is below AA over live pixels', sub);

  const calm = await ctx.reducedPage.evaluate(collectScroller);
  if (!calm.present) {
    report.fail('canvas-scroller hero missing in the reduced-motion session');
    return;
  }
  const calmViewports = calm.trackHeight / vh;
  if (calmViewports > 1.2) report.fail('reduced motion: hero still reserves a pin track for an animation that never runs', { viewports: Number(calmViewports.toFixed(2)) });
  else report.pass(`reduced motion: hero track collapsed to ${calmViewports.toFixed(2)} viewports`);
  if (layered(calm.band3Shadow.titleFilter) >= 2) report.pass('reduced motion: Band 3 legibility treatment still applied');
  else report.fail('reduced motion: Band 3 legibility treatment lost', calm.band3Shadow);
}

module.exports = { run, SAMPLE_POINTS };