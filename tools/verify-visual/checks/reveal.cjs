'use strict';

/**
 * REVEAL — the entrance choreography must actually be a choreography.
 *
 * `useScrollReveals` drives every `[data-reveal]` node with a GSAP `fromTo`
 * (autoAlpha 0 to 1 over 1.1s, power3.out, `once: true`, triggered at `top 88%`).
 * GSAP tweens are not Web Animations, so they cannot be listed — only sampled
 * while they run. This check therefore
 *
 *   1. proves the resting state is hidden below the fold (progressive
 *      enhancement: markup hides, GSAP reveals),
 *   2. samples opacity and translate through the trigger and demands a run of
 *      strictly increasing intermediate values — a jump from 0 straight to 1 is
 *      a broken tween, not an entrance,
 *   3. proves `once: true` by scrolling away and back,
 *   4. proves the reduced-motion session paints the deck fully composed with
 *      nothing animating, and that nothing animates perpetually at rest.
 *
 * Frames are captured mid-flight so a regression leaves visual evidence.
 */

const { captureFrame } = require('../lib/screenshot.cjs');

/** Live opacity and transform of one node — the only two things GSAP writes. */
function revealState(selector) {
  const element = document.querySelector(selector);
  if (!element) return null;
  const style = getComputedStyle(element);
  const matrix = style.transform === 'none' ? null : style.transform.match(/matrix\(([^)]+)\)/);
  return {
    opacity: Number.parseFloat(style.opacity),
    translateY: matrix ? Number.parseFloat(matrix[1].split(',')[5]) : 0,
  };
}

/** Mark the next below-the-fold reveal targets so sampling can address them. */
function tagPending(count) {
  return Array.from(document.querySelectorAll('[data-reveal]'))
    .filter((element) => element.getBoundingClientRect().top > window.innerHeight * 0.9)
    .slice(0, count)
    .map((element, index) => {
      element.setAttribute('id', `pjp-reveal-${index}`);
      return `#pjp-reveal-${index}`;
    });
}

async function run(ctx) {
  const { page, report } = ctx;

  await page.setViewportSize(ctx.session.VIEWPORT);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await ctx.session.settleFonts(page);

  // The hero ingests a 158-frame JPEG sequence on mount, and decoding it stalls
  // the main thread for seconds. Wait for the deck to go quiet before sampling:
  // the deck runs GSAP with `ticker.lagSmoothing(0)`, so a single long frame
  // lets the whole entrance elapse in one tick and the reveal reads as a jump.
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const started = performance.now();
        const deltas = [];
        let last = performance.now();
        const tick = () => {
          const now = performance.now();
          deltas.push(now - last);
          last = now;
          if (deltas.length > 24) deltas.shift();
          const quiet = deltas.length === 24 && deltas.every((delta) => delta < 50);
          if (quiet || now - started > 15000) resolve(true);
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );

  const selectors = await page.evaluate(tagPending, 3);
  if (!selectors.length) {
    report.warn('no `[data-reveal]` node sits below the fold — nothing to sample');
    return;
  }

  for (const selector of selectors) {
    const label = await page.evaluate((target) => {
      const element = document.querySelector(target);
      return element ? `${element.tagName.toLowerCase()}:${(element.textContent || '').trim().slice(0, 22)}` : target;
    }, selector);

    const atRest = await page.evaluate(revealState, selector);
    if (!atRest) continue;

    if (atRest.opacity > 0.02) {
      report.fail(`[${label}] revealed before it was scrolled into view`, atRest);
    } else {
      report.pass(`[${label}] hidden at rest below the fold`);
    }

    // Arm a frame-rate sampler *inside* the page before scrolling. Sampling
    // across the Playwright boundary would leave the first read queued behind
    // whatever long task the reveal triggers, which is exactly the window where
    // the tween runs.
    await page.evaluate((target) => {
      const element = document.querySelector(target);
      if (!element) return;
      window.__pjpRevealSamples = [];
      const started = performance.now();
      const tick = () => {
        const style = getComputedStyle(element);
        const matrix = style.transform === 'none' ? null : style.transform.match(/matrix\(([^)]+)\)/);
        window.__pjpRevealSamples.push({
          t: Math.round(performance.now() - started),
          opacity: Number.parseFloat(style.opacity),
          translateY: matrix ? Number.parseFloat(matrix[1].split(',')[5]) : 0,
        });
        if (performance.now() - started < 2200) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, selector);

    await page.evaluate((target) => {
      const element = document.querySelector(target);
      if (!element) return;
      const y = element.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.5;
      const lenis = window.__pjpLenis;
      if (lenis && typeof lenis.scrollTo === 'function') lenis.scrollTo(y, { immediate: true });
      else window.scrollTo({ top: y, behavior: 'instant' });
    }, selector);

    await page.waitForTimeout(2500);
    const samples = await page.evaluate(() => window.__pjpRevealSamples || []);

    const final = samples[samples.length - 1];
    if (!final || final.opacity < 0.98) {
      report.fail(`[${label}] reveal never completed`, { samples: samples.map((sample) => sample.opacity) });
      continue;
    }

    const rising = samples.filter((sample, index) => index > 0 && sample.opacity > samples[index - 1].opacity + 0.002);
    const midFlight = samples.filter((sample) => sample.opacity > 0.02 && sample.opacity < 0.98);
    if (midFlight.length < 3 || rising.length < 3) {
      report.fail(`[${label}] reveal jumped instead of animating`, {
        intermediates: midFlight.length,
        risingSteps: rising.length,
        samples: samples.map((sample) => `${sample.t}ms:${Number(sample.opacity.toFixed(3))}`),
      });
    } else {
      report.pass(
        `[${label}] animated through ${midFlight.length} intermediate values ` +
          `(lift ${Math.round(Math.abs(samples[0].translateY))}px to ${Math.round(Math.abs(final.translateY))}px)`,
      );
    }
    await ctx.captureFrame(`reveal-${selectors.indexOf(selector)}`, { kind: 'reveal' });

    // `once: true` — the entrance must not replay when the operator scrolls back.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(500);
    const after = await page.evaluate(revealState, selector);
    if (after && after.opacity < 0.98) {
      report.fail(`[${label}] reveal replayed after scrolling away (once: true lost)`, after);
    } else {
      report.pass(`[${label}] settled for good (once: true)`);
    }
  }

  // Nothing may animate forever: the deck has to be still at rest.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1500);
  const running = await page.evaluate(() =>
    document.getAnimations().map((animation) => ({
      target:
        animation.effect && animation.effect.target
          ? `${animation.effect.target.tagName.toLowerCase()}.${String(animation.effect.target.className || '').split(' ')[0]}`
          : '?',
      state: animation.playState,
      iterations: animation.effect ? Number(animation.effect.getTiming().iterations) : null,
    })),
  );
  const perpetual = running.filter((animation) => animation.state === 'running' && animation.iterations === Infinity);
  if (perpetual.length) {
    report.fail('perpetual animation running at rest', perpetual.slice(0, 6));
  } else {
    report.pass(`no perpetual animation at rest (${running.length} animation object(s))`);
  }

  // Reduced motion: the deck arrives fully composed with nothing moving.
  const composed = await ctx.reducedPage.evaluate(() => ({
    total: document.querySelectorAll('[data-reveal]').length,
    hidden: Array.from(document.querySelectorAll('[data-reveal]')).filter(
      (element) => Number.parseFloat(getComputedStyle(element).opacity) < 0.98,
    ).length,
    running: document.getAnimations().filter((animation) => animation.playState === 'running').length,
  }));
  if (composed.hidden) {
    report.fail(`reduced motion: ${composed.hidden}/${composed.total} [data-reveal] nodes hidden at load`, composed);
  } else {
    report.pass(`reduced motion: all ${composed.total} [data-reveal] nodes composed at load`);
  }
  if (composed.running) {
    report.fail(`reduced motion: ${composed.running} animation(s) still running`, composed);
  } else {
    report.pass('reduced motion: zero animations running');
  }
}

module.exports = { name: 'reveal', run };


