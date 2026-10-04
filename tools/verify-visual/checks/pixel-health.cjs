'use strict';

/**
 * GRADE — what the pixels actually look like, after every DOM-level check has
 * passed.
 *
 * Token sweeps and class audits cannot see chroma: a photograph graded violet, a
 * WebGL rim light that reads cool, and a champagne button pushed to broadcast
 * gold have all survived every DOM check this project has run. This check looks
 * at rendered frames only — DOM is not consulted.
 *
 * The cool test is run at two channel margins. LCD subpixel antialiasing fringes
 * the blue channel at glyph edges, so a narrow margin reports a floor that is
 * pure rendering artefact; re-running at `+60` collapses the artefact and leaves
 * genuine chroma. Only the wide-margin reading is gated.
 *
 * Runs last: it grades the frames every other check recorded.
 */

const { gradeMetrics, coolCastAtMargins } = require('../lib/pixel-metrics.cjs');

const LIMITS = {
  /** Genuine (non-antialiasing) cool cast, share of frame at channel margin +60. */
  coolCastPercent: 0.6,
  /** Blown pixels. The deck's brightest ink is champagne, never #fff. */
  pureWhitePercent: 0.35,
  /** Champagne pushed to broadcast gold. */
  saturatedGoldPercent: 3.5,
};

function list(frames) {
  return frames.map((frame) => frame.name).join(', ');
}

async function run(ctx) {
  const { report } = ctx;

  if (!ctx.frames.length) {
    report.fail('grade check has no frames to grade — the capture stage recorded nothing');
    return;
  }

  let worstCool = { name: null, value: 0 };
  let worstWhite = { name: null, value: 0 };
  let worstGold = { name: null, value: 0 };

  for (const frame of ctx.frames) {
    const metrics = gradeMetrics(frame.image, { cssWidth: ctx.session.VIEWPORT.width });
    const margins = coolCastAtMargins(frame.image, [25, 60]);
    frame.metrics = metrics;
    frame.margins = margins;

    if (metrics.coolCastPercent > worstCool.value) worstCool = { name: frame.name, value: metrics.coolCastPercent };
    if (metrics.pureWhitePercent > worstWhite.value) worstWhite = { name: frame.name, value: metrics.pureWhitePercent };
    if (metrics.saturatedGoldPercent > worstGold.value) worstGold = { name: frame.name, value: metrics.saturatedGoldPercent };

    report.note(
      `${frame.name} — mean rgb ${metrics.mean.r}/${metrics.mean.g}/${metrics.mean.b}, ` +
        `lit ${metrics.litPercent.toFixed(1)}%, cool +25 ${margins['+25']}% / +60 ${margins['+60']}%, ` +
        `white ${metrics.pureWhitePercent.toFixed(2)}%, gold ${metrics.saturatedGoldPercent.toFixed(2)}%, ` +
        `top ${metrics.top.slice(0, 3).map((bucket) => `${bucket.hex} ${bucket.share.toFixed(0)}%`).join(' ')}`,
    );
  }

  const offenders = ctx.frames.filter((frame) => frame.margins['+60'] > LIMITS.coolCastPercent);
  if (offenders.length) {
    for (const frame of offenders.slice(0, 6)) {
      report.fail(
        `cool cast in ${frame.name} — ${frame.margins['+60']}% of the frame sits blue of red by 60 (limit ${LIMITS.coolCastPercent}%)`,
        { coolBox: frame.metrics.coolBox, mean: frame.metrics.mean, top: frame.metrics.top.map((bucket) => bucket.hex) },
      );
    }
  } else {
    report.pass(`no cool cast beyond the antialiasing floor in ${ctx.frames.length} frames (worst ${worstCool.name} at ${worstCool.value.toFixed(2)}%)`);
  }

  const blown = ctx.frames.filter((frame) => frame.metrics.pureWhitePercent > LIMITS.pureWhitePercent);
  if (blown.length) {
    report.fail(`${blown.length} frame(s) clip to pure white — ${list(blown)}`, { limit: LIMITS.pureWhitePercent });
  } else {
    report.pass(`no pure-white clipping (worst ${worstWhite.value.toFixed(2)}%, limit ${LIMITS.pureWhitePercent}%)`);
  }

  const gilded = ctx.frames.filter((frame) => frame.metrics.saturatedGoldPercent > LIMITS.saturatedGoldPercent);
  if (gilded.length) {
    report.fail(`${gilded.length} frame(s) run to broadcast gold — ${list(gilded)}`, { limit: LIMITS.saturatedGoldPercent });
  } else {
    report.pass(`champagne stayed champagne (worst ${worstGold.value.toFixed(2)}%, limit ${LIMITS.saturatedGoldPercent}%)`);
  }

  const mean = ctx.frames.reduce((sum, frame) => sum + frame.metrics.litPercent, 0) / ctx.frames.length;
  if (mean < 4) report.warn(`deck reads very dark — ${mean.toFixed(1)}% lit pixels across the run`);
  else report.note(`average lit share across the run: ${mean.toFixed(1)}%`);
}

module.exports = { run, LIMITS };
