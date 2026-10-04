'use strict';

/**
 * Browser session helpers: navigation, settle and scrolling.
 *
 * Two sessions are used by design. A `reduced` session (prefers-reduced-motion:
 * reduce) removes Lenis and the reveal choreography, so scroll positions are
 * exact and every node is in its composed resting state — that is the session
 * static measurement is taken in. A `live` session keeps Lenis and GSAP, so the
 * scrub choreography is measured through the same smoothing an operator feels.
 */

const VIEWPORT = { width: 1440, height: 900 };

async function openPage(browser, { url, reducedMotion = 'no-preference', deviceScaleFactor = 2 } = {}) {
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor, reducedMotion });
  const page = await context.newPage();
  const problems = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console.error: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    problems.push(`requestfailed: ${request.url().slice(0, 110)} (${request.failure() ? request.failure().errorText : 'unknown'})`);
  });
  await page.goto(url, { waitUntil: 'load' });
  return { context, page, problems };
}

/** Wait for fonts and the WebGL boot, without touching reveal choreography. */
async function settleFonts(page, { waitMs = 1600 } = {}) {
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(waitMs);
}

/**
 * Force the deck into its composed resting state.
 *
 * Only legitimate in the reduced-motion session: the injected rule pins every
 * `[data-reveal]` section visible, which is what static measurement needs and
 * exactly what would blind a motion check.
 */
async function settle(page, options = {}) {
  await page.addStyleTag({ content: '[data-reveal]{opacity:1 !important;transform:none !important}' });
  await settleFonts(page, options);
}

/** Scroll to a fraction of the document height. */
async function scrollToRatio(page, ratio, { settleMs = 700 } = {}) {
  await page.evaluate((fraction) => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo(0, Math.max(0, Math.round(total * fraction)));
    window.dispatchEvent(new Event('scroll'));
  }, ratio);
  await page.waitForTimeout(settleMs);
}

/** Native (non-Lenis) scroll, used in the reduced-motion session. */
async function scrollToY(page, y) {
  await page.evaluate((target) => {
    window.scrollTo(0, target);
    window.dispatchEvent(new Event('scroll'));
  }, y);
  await page.waitForTimeout(600);
}

async function scrollToSelector(page, selector, { offset = 0, settleMs = 700 } = {}) {
  const y = await page.evaluate(
    ({ sel, dy }) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + dy);
      window.dispatchEvent(new Event('scroll'));
      return Math.round(window.scrollY);
    },
    { sel: selector, dy: offset },
  );
  await page.waitForTimeout(settleMs);
  return y;
}

/** Wheel scroll driven through the deck's own Lenis smoothing, then settle. */
async function wheelTo(page, deltaY, { settleMs = 1500, steps = 4 } = {}) {
  for (let step = 0; step < steps; step += 1) await page.mouse.wheel(0, deltaY / steps);
  await page.waitForTimeout(settleMs);
  return page.evaluate(() => Math.round(window.scrollY));
}

module.exports = { VIEWPORT, openPage, settle, settleFonts, scrollToY, scrollToRatio, scrollToSelector, wheelTo };
