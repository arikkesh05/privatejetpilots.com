'use strict';

/**
 * FUSELAGE — the cutaway section's contract (`FuselageScroller`).
 *
 * The section is a 700vh track with a CSS-sticky frame (deliberately not a
 * ScrollTrigger pin — see the note in the component) that holds a 125vh
 * architectural cutaway while a GSAP timeline scrubs two things at once: a
 * camera pan that travels the aircraft nose to tail, and five zone copy layers
 * that cross-fade with their schematic markers lighting in step.
 *
 * Three properties are load-bearing and none of them are visible in a single
 * screenshot, which is exactly why they need a permanent check:
 *
 *   1. The camera pan is *monotonic*. Five discrete opacity fades would look
 *      right in every still frame while the drawing never actually travelled.
 *      The pan is read from the live computed matrix `translateY`, never from
 *      the authored `yPercent`, so a broken tween cannot satisfy this.
 *   2. The five zones illuminate in *strict sequential order*. Because each
 *      zone's copy and its marker are driven off the same timeline position,
 *      a regression that desynchronises them (or reorders them) is exactly the
 *      defect that reads as "fine" in a still and is broken in motion.
 *   3. The centre corridor stays clear of copy at every breakpoint. The
 *      schematic is the focal object; copy encroaching on the middle third
 *      destroys the composition at the sizes the brief cares about.
 *
 * Measured in the live session for motion (Lenis and GSAP intact, so the scrub
 * is observed through the smoothing an operator actually feels) and in the
 * reduced session for static composition and ink contrast.
 */

const { collectFuselage, collectTextNodes, paintInk } = require('../lib/page-probes.cjs');
const { captureViewport, cropToBox, pixelsOf } = require('../lib/screenshot.cjs');
const { parseColor, worstCaseContrast } = require('../lib/color.cjs');

/** Zone order is the reading order and the scroll order — asserted, not assumed. */
const ZONE_IDS = ['deck', 'galley', 'club', 'stateroom', 'aft'];

/** Mid-slice of each zone's fifth of the track, where its copy is fully composed. */
const ZONE_STATIONS = ZONE_IDS.map((_, index) => (index + 0.5) / ZONE_IDS.length);

/** Fine sweep used to prove monotonic travel and strict zone ordering. */
const SWEEP_STATIONS = 21;

/** Breakpoints the corridor contract is held at. */
const BREAKPOINTS = [375, 768, 1440];

/** Translation must cover at least this share of a viewport's height. */
const MIN_TRAVEL_VIEWPORTS = 0.15;

/** A zone counts as lit when its copy layer is essentially fully composed. */
const LIT = 0.9;
const DARK = 0.05;

/** Contrast floor demanded of the specification micro-labels. */
const LABEL_CONTRAST_FLOOR = 7;

/** Parse the Y translation out of a `matrix(...)` computed transform. */
function translateY(transform) {
  if (!transform || transform === 'none') return null;
  const matrix = transform.match(/^matrix(3d)?\(([^)]+)\)$/);
  if (matrix) {
    const parts = matrix[2].split(',').map((part) => Number.parseFloat(part));
    return matrix[1] ? parts[13] : parts[5];
  }
  const translate = transform.match(/translate(?:3d|Y)?\(\s*(-?[\d.]+)px?/);
  return translate ? Number.parseFloat(translate[1]) : null;
}

/** Scroll the cutaway's own track to a fraction of its scrubbable range. */
async function scrollFuselageTo(page, fraction, { settleMs = 1300 } = {}) {
  const y = await page.evaluate((f) => {
    const section = document.querySelector('[aria-label="Fuselage cutaway"]');
    if (!section) return null;
    const range = Math.max(0, section.offsetHeight - window.innerHeight);
    const target = section.getBoundingClientRect().top + window.scrollY + range * f;
    window.scrollTo(0, Math.round(target));
    window.dispatchEvent(new Event('scroll'));
    return Math.round(window.scrollY);
  }, fraction);
  await page.waitForTimeout(settleMs);
  return y;
}

/** The zone whose copy is currently composed, or null when the frame is between two. */
function litZone(snapshot) {
  let best = null;
  for (const zone of snapshot.zones) {
    if (zone.visibility === 'hidden' || zone.opacity < LIT) continue;
    if (!best || zone.opacity > best.opacity) best = zone;
  }
  if (!best) return null;
  return { index: ZONE_IDS.indexOf(best.id), id: best.id, opacity: best.opacity, markerOpacity: best.markerOpacity };
}

/** Worst-case ink/backdrop contrast of the visible node whose text contains a target. */
async function worstContrastOf(page, targets, deviceScaleFactor) {
  const nodes = await page.evaluate(collectTextNodes);
  const inFrame = nodes.filter(
    (node) => targets.some((target) => node.text.includes(target)) && node.effectiveOpacity > 0.02,
  );
  if (!inFrame.length) return null;

  /* Same two requirements as the contrast census: the knockout must render
     before the shutter, and the crop has to be cut at the session's real device
     pixel ratio or it reads the wrong region of the frame entirely. */
  const indices = inFrame.map((node) => node.index);
  const noTransition = await page.addStyleTag({ content: '*,*::before,*::after{transition:none !important}' });
  await page.evaluate(paintInk, { indices, visible: false });
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(() => done(true)))));
  const backdrop = await captureViewport(page, null, { deviceScaleFactor });
  await page.evaluate(paintInk, { indices, visible: true });
  await noTransition.evaluate((node) => node.remove());

  let worst = null;
  for (const node of inFrame) {
    const crop = cropToBox(backdrop, node.box, deviceScaleFactor);
    if (!crop) continue;
    const ink = parseColor(node.colour);
    if (!ink) continue;
    ink.a *= node.effectiveOpacity;
    const score = worstCaseContrast(ink, pixelsOf(crop), { tolerance: 0.01 });
    if (!score) continue;
    if (!worst || score.worst < worst.worst) worst = { worst: score.worst, sample: node };
  }
  return worst;
}

async function run(ctx) {
  const { page, reducedPage, report, deviceScaleFactor } = ctx;

  const present = await page.evaluate(collectFuselage);
  if (!present.present) {
    report.fail('fuselage cutaway section is missing from the live session');
    return;
  }

  /* ---- geometry: the cutaway must be tall enough for the camera to travel --- */
  const viewports = present.trackHeight / present.vh;
  if (Math.abs(viewports - 7) < 0.15) {
    report.pass(`cutaway reserves a 7-viewport scrub track (${Math.round(present.trackHeight)}px)`);
  } else {
    report.fail('cutaway track is no longer 700vh', { viewports: Number(viewports.toFixed(2)) });
  }
  const svgViewports = present.svgHeight / present.vh;
  if (svgViewports > 1.1 && svgViewports < 1.3) {
    report.pass(`cutaway drawn at ${(svgViewports * 100).toFixed(1)}vh — leaves travel for the pan`);
  } else {
    report.fail('cutaway SVG is outside the 110–130vh band', { viewports: Number(svgViewports.toFixed(2)) });
  }

  /* ---- sweep: monotonic camera travel + strict zone ordering -------------- */
  const sweep = [];
  for (let step = 0; step < SWEEP_STATIONS; step += 1) {
    const fraction = step / (SWEEP_STATIONS - 1);
    // eslint-disable-next-line no-await-in-loop
    await scrollFuselageTo(page, fraction);
    // eslint-disable-next-line no-await-in-loop
    const snapshot = await page.evaluate(collectFuselage);
    sweep.push({ fraction, y: translateY(snapshot.camera && snapshot.camera.transform), zone: litZone(snapshot) });
  }

  const readings = sweep.filter((sample) => sample.y !== null);
  if (readings.length < SWEEP_STATIONS - 1) {
    report.fail('camera transform could not be read at most stations', {
      readable: readings.length,
      of: SWEEP_STATIONS,
      sample: sweep.find((s) => s.y === null) || null,
    });
  } else {
    let regressions = 0;
    let flat = 0;
    for (let index = 1; index < readings.length; index += 1) {
      const delta = readings[index].y - readings[index - 1].y;
      /* Upward travel is negative. Allow a sub-pixel wobble, reject real backtracking. */
      if (delta > 1) regressions += 1;
      if (delta >= -1) flat += 1;
    }
    const span = readings[0].y - readings[readings.length - 1].y;
    const travel = span / present.vh;
    if (regressions === 0 && flat <= 2 && travel >= MIN_TRAVEL_VIEWPORTS) {
      report.pass(
        `camera pans monotonically nose to tail — ${readings.length} stations, ${Math.round(readings[0].y)}px → ${Math.round(readings[readings.length - 1].y)}px (${travel.toFixed(3)} viewports of travel)`,
      );
    } else {
      report.fail('camera pan is not a monotonic nose-to-tail move', {
        regressions,
        flatStations: flat,
        travelViewports: Number(travel.toFixed(3)),
      });
    }
  }

  const order = [];
  for (const sample of sweep) {
    const active = sample.zone ? sample.zone.index : -1;
    if (active >= 0 && order[order.length - 1] !== active) order.push(active);
  }
  if (order.length === ZONE_IDS.length && order.every((index, position) => index === position)) {
    report.pass(`all ${ZONE_IDS.length} zones illuminate in strict order — ${ZONE_IDS.join(' → ')}`);
  } else {
    report.fail('zones do not illuminate in strict sequential order', {
      observed: order,
      expected: ZONE_IDS.map((_, index) => index),
    });
  }

  /* ---- per-zone stations: copy and marker light together, others go dark --- */
  for (let index = 0; index < ZONE_STATIONS.length; index += 1) {
    // eslint-disable-next-line no-await-in-loop
    await scrollFuselageTo(page, ZONE_STATIONS[index]);
    // eslint-disable-next-line no-await-in-loop
    const snapshot = await page.evaluate(collectFuselage);
    const active = litZone(snapshot);
    const quiet = snapshot.zones.every((zone, position) => position === index || zone.opacity < DARK || zone.visibility === 'hidden');
    if (active && active.index === index && active.markerOpacity !== null && active.markerOpacity >= 0.9 && quiet) {
      report.pass(`Zone ${index + 1} (${ZONE_IDS[index]}) composes its copy with its marker lit — every other zone dark`);
    } else {
      report.fail(`Zone ${index + 1} (${ZONE_IDS[index]}) is not the sole lit station`, {
        active: active ? active.id : null,
        markerOpacity: active ? active.markerOpacity : null,
        zones: snapshot.zones,
      });
    }
  }

  /* ---- corridor: clear at the session viewport --------------------------- */
  const liveSnapshot = await page.evaluate(collectFuselage);
  if (liveSnapshot.corridor.intrusions.length === 0) {
    report.pass(`no copy intrudes on the centre corridor at ${liveSnapshot.viewportWidth}px`);
  } else {
    report.fail('copy intrudes on the centre corridor', liveSnapshot.corridor.intrusions);
  }

  /* ---- corridor across breakpoints, in isolated contexts ----------------- */
  /* The suite's two sessions share one fixed viewport, so each breakpoint needs
     its own context. Reusing `page.setViewportSize` here would leave the live
     session resized for the checks that run after this one. */
  const browser = page.context().browser();
  for (const width of BREAKPOINTS) {
    // eslint-disable-next-line no-await-in-loop
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor,
      reducedMotion: 'no-preference',
    });
    const narrow = await context.newPage();
    try {
      await narrow.goto(ctx.baseUrl, { waitUntil: 'load' });
      await narrow.waitForTimeout(1500);
      let detail = null;
      let clear = true;
      for (let index = 0; index < ZONE_STATIONS.length; index += 1) {
        // eslint-disable-next-line no-await-in-loop
        await scrollFuselageTo(narrow, ZONE_STATIONS[index]);
        // eslint-disable-next-line no-await-in-loop
        const snapshot = await narrow.evaluate(collectFuselage);
        if (!snapshot.present || snapshot.corridor.intrusions.length) {
          clear = false;
          detail = { zone: ZONE_IDS[index], intrusions: snapshot.present ? snapshot.corridor.intrusions : 'section absent' };
          break;
        }
      }
      if (clear) report.pass(`centre corridor clear across all ${ZONE_IDS.length} zones at ${width}px`);
      else report.fail(`centre corridor obstructed at ${width}px`, detail);
    } finally {
      await context.close();
    }
  }

  /* ---- reduced motion: the animated composition must be composed statically */
  const calm = await reducedPage.evaluate(collectFuselage);
  if (!calm.present) {
    report.fail('fuselage cutaway missing in the reduced-motion session');
  } else {
    const calmViewports = calm.trackHeight / calm.vh;
    if (calmViewports <= 1.2) {
      report.pass(`reduced motion: cutaway collapses to a static plate (${calmViewports.toFixed(2)} viewports)`);
    } else {
      report.fail('reduced motion: cutaway still reserves a 700vh track for a pan that never runs', {
        viewports: Number(calmViewports.toFixed(2)),
      });
    }
  }

  /* ---- specification micro-labels: ink contrast over the live backdrop ----- */
  const specLabels = ['Primary', 'Galley', 'Upholstery', 'Berth', 'En-suite'];
  const worstLabel = await worstContrastOf(page, specLabels, deviceScaleFactor);
  if (!worstLabel) {
    report.fail('specification micro-labels were not in frame at the final station');
  } else {
    const sample = worstLabel.sample;
    const text = sample.text.trim();
    const ink = `${sample.colour} @ ${sample.fontSize}`;
    if (worstLabel.worst >= LABEL_CONTRAST_FLOOR) {
      report.pass(
        `specification micro-labels clear ${LABEL_CONTRAST_FLOOR}:1 over live pixels — worst ${worstLabel.worst.toFixed(2)}:1 ("${text}", ${ink})`,
      );
    } else {
      report.fail('specification micro-labels are below the contrast floor', {
        worst: Number(worstLabel.worst.toFixed(2)),
        needed: LABEL_CONTRAST_FLOOR,
        text,
        ink,
      });
    }
  }
}

module.exports = { run, ZONE_IDS, translateY };
