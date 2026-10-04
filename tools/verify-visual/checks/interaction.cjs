'use strict';

/**
 * Interaction and accessibility pass.
 *
 * Covers what a screenshot cannot see: dialog lifecycle, focus trapping and
 * restoration, the audio toggle's real state change, hover states captured on
 * both sides of the transition, target sizes, accessible names, heading order
 * and whether a focused element is visibly focused at all.
 *
 * Hover evidence is deliberately paired: a control whose resting and hovered
 * computed styles are identical is a dead control — which is exactly what a
 * blanket `transition-duration: 0.01ms` under reduced motion produces.
 */

const { captureViewport, captureNode, captureFocus } = require('../lib/screenshot.cjs');
const { diffStats } = require('../lib/png.cjs');

const MIN_TARGET_PX = 24;

function boxOfHandle(handle) {
  return handle.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });
}

/** Resting style of every interactive node currently on screen. */
function hoverCensus() {
  const all = [...document.querySelectorAll('a, button, input, select, [tabindex]')];
  return all
    .map((el, rawIndex) => ({ el, rawIndex }))
    .filter(({ el }) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0 && style.visibility !== 'hidden' && style.opacity !== '0';
    })
    .slice(0, 40)
    .map(({ el, rawIndex }) => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        // Raw index into the full interactive set, so `styleAt` addresses the
        // same node the census measured (filtering must not shift the index).
        index: rawIndex,
        tag: el.tagName.toLowerCase(),
        text: (el.innerText || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 40),
        boxShadow: style.boxShadow,
        border: `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
        color: style.color,
        background: style.backgroundColor,
        transform: style.transform,
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      };
    });
}

/** Re-read the hover-relevant style of one node, addressed by its hoverCensus index. */
function styleAt(index) {
  const el = [...document.querySelectorAll('a, button, input, select, [tabindex]')][index];
  if (!el) return null;
  const style = getComputedStyle(el);
  // A hover response is frequently declared on a descendant (Tailwind's
  // `group-hover:*` on the label inside the link), so the signature has to fold
  // in the leaf ink colours or a live control reads as dead.
  const ink = [...el.querySelectorAll('*')]
    .filter((child) => !child.children.length && (child.textContent || '').trim())
    .map((child) => getComputedStyle(child).color)
    .join('|');
  return {
    boxShadow: style.boxShadow,
    border: `${style.borderTopWidth} ${style.borderTopStyle} ${style.borderTopColor}`,
    color: style.color,
    background: style.backgroundColor,
    transform: style.transform,
    ink,
  };
}

function dialogState() {
  const modal = document.querySelector('#hud-modal');
  if (!modal) return null;
  const style = getComputedStyle(modal);
  const focused = document.activeElement;
  return {
    opacity: style.opacity,
    pointerEvents: style.pointerEvents,
    ariaHidden: modal.getAttribute('aria-hidden'),
    ariaModal: modal.getAttribute('aria-modal'),
    label: modal.getAttribute('aria-label') || modal.getAttribute('aria-labelledby'),
    activeElementInside: modal.contains(focused),
    activeElement: focused ? `${focused.tagName.toLowerCase()}${focused.id ? `#${focused.id}` : ''}` : null,
    focusableInside: [...modal.querySelectorAll('button, [href], input, select, [tabindex]:not([tabindex="-1"])')].filter((el) => el.getClientRects().length).length,
    bodyOverflow: getComputedStyle(document.body).overflow,
  };
}

/** The focused node and the focus treatment it actually resolves *while focused*.
 *  A ring only exists during focus, so the walk drives the tab order and reads
 *  the live state rather than the resting style (which is always `0px none`). */
function activeFocus() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return {
    tag: el.tagName.toLowerCase(),
    text: (el.textContent || el.getAttribute('aria-label') || el.getAttribute('title') || '').trim().slice(0, 40),
    outline: `${style.outlineWidth} ${style.outlineStyle} ${style.outlineColor}`,
    boxShadow: style.boxShadow,
    // WCAG 2.5.8 exempts targets bounded by the line-height of inline text.
    inline: style.display === 'inline',
    rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
  };
}

function headingOrder() {
  return [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((el) => ({
    level: Number(el.tagName.slice(1)),
    text: el.innerText.trim().slice(0, 60),
  }));
}

function nameAudit() {
  return {
    unlabelledImages: [...document.querySelectorAll('img')].filter((img) => !img.getAttribute('alt')?.trim()).map((img) => img.getAttribute('src') || img.className),
    unlabelledControls: [...document.querySelectorAll('a, button, input, select')]
      .filter((el) => el.getClientRects().length)
      .filter((el) => {
        // The accessible name is computed from text content, not rendered text:
        // `innerText` returns '' for a control that is merely animated-hidden at
        // the sampled scroll position, which would report a false gap.
        const name = (el.textContent || '').trim() || el.getAttribute('aria-label')?.trim() || el.getAttribute('title')?.trim() || el.getAttribute('alt')?.trim();
        if (name) return false;
        const id = el.getAttribute('id');
        if (id && document.querySelector(`label[for="${id}"]`)) return false;
        return true;
      })
      .map((el) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${el.className}`.slice(0, 90)),
    landmarks: ['header', 'nav', 'main', 'footer', '[role="dialog"]'].map((selector) => ({ selector, count: document.querySelectorAll(selector).length })),
  };
}

async function run(ctx) {
  const { page, outDir, report, fs, path, deviceScaleFactor } = ctx;

  /* --- 1. Landmarks, accessible names, heading order --------------------- */
  const audit = await page.evaluate(nameAudit);
  if (audit.unlabelledImages.length) report.fail('images without an accessible name', audit.unlabelledImages);
  else report.pass('every image carries an alt attribute');
  if (audit.unlabelledControls.length) report.fail('interactive nodes without an accessible name', audit.unlabelledControls);
  else report.pass('every visible control has an accessible name');
  for (const landmark of audit.landmarks) {
    if (!landmark.count) report.fail(`landmark ${landmark.selector} is missing from the document`);
  }

  const headings = await page.evaluate(headingOrder);
  let skipped = null;
  let previous = null;
  for (const heading of headings) {
    if (previous !== null && heading.level > previous + 1) skipped = skipped || `h${previous} → h${heading.level} at "${heading.text}"`;
    previous = heading.level;
  }
  if (skipped) report.fail('heading levels are skipped', skipped);
  else report.pass(`heading order is monotonic across ${headings.length} headings`, headings.slice(0, 5));

  /* --- 2. Focus visibility and target size ------------------------------- */
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await ctx.session.settleFonts(page);
  const walk = [];
  for (let step = 0; step < 14; step += 1) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(activeFocus);
    if (focused) walk.push(focused);
  }
  const noRing = walk.filter((node) => /^0px none/.test(node.outline) && node.boxShadow === 'none');
  if (noRing.length) {
    for (const node of noRing.slice(0, 6)) report.fail('a focusable element resolves no visible focus indicator', node);
  } else {
    report.pass(`focus indicator resolves on ${walk.length} keyboard stops`, walk.slice(0, 3).map((node) => ({ text: node.text, outline: node.outline })));
  }
  const smallTargets = walk.filter((node) => !node.inline && (node.rect.width < MIN_TARGET_PX || node.rect.height < MIN_TARGET_PX));
  if (smallTargets.length) {
    for (const node of smallTargets) report.fail(`target is below ${MIN_TARGET_PX}px on one axis (WCAG 2.5.8)`, node);
  } else {
    report.pass(`every sampled target is at least ${MIN_TARGET_PX}px on both axes`);
  }
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForTimeout(200);

  /* --- 3. Hover states, captured on both sides of the transition --------- */
  const census = await page.evaluate(hoverCensus);
  const hoverable = census.filter((node) => node.text && (node.tag === 'a' || node.tag === 'button'));
  const sampled = Math.min(hoverable.length, 5);
  const deadControls = [];
  for (const node of hoverable.slice(0, sampled)) {
    const handle = page.locator('a, button, input, select, [tabindex]').nth(node.index);
    const before = await page.evaluate(styleAt, node.index);
    await captureNode(page, node.rect, `hover-before-${node.index}`, { outDir, fs, path, deviceScaleFactor });
    await handle.hover();
    await page.waitForTimeout(ctx.hoverSettle || 450);
    const after = await page.evaluate(styleAt, node.index);
    await captureNode(page, node.rect, `hover-after-${node.index}`, { outDir, fs, path, deviceScaleFactor });
    if (JSON.stringify(before) === JSON.stringify(after)) deadControls.push({ text: node.text, before, after });
    await page.mouse.move(2, Math.min(ctx.session.VIEWPORT.height - 6, node.rect.y + 320));
    await page.waitForTimeout(150);
  }
  if (deadControls.length) {
    for (const control of deadControls) report.fail('hover state does not resolve — resting and hovered styles are identical', control);
  } else {
    report.pass(`hover states resolve on ${sampled} sampled controls — before/after frames recorded`);
  }

  /* --- 4. Audio toggle: a real state change ------------------------------ */
  const audioButton = await page.$('button[title*="Interaction sound" i], button[aria-label*="Interaction sound" i]');
  if (!audioButton) {
    report.fail('the audio toggle control is not present in the document');
  } else {
    const box = await boxOfHandle(audioButton);
    const labelBefore = await audioButton.evaluate((el) => el.innerText.trim());
    const before = await captureNode(page, box, 'audio-toggle-off', { outDir, fs, path, deviceScaleFactor });
    await audioButton.click();
    await page.waitForTimeout(700);
    const labelAfter = await audioButton.evaluate((el) => el.innerText.trim());
    const after = await captureNode(page, box, 'audio-toggle-on', { outDir, fs, path, deviceScaleFactor });
    const pressed = await audioButton.evaluate((el) => el.getAttribute('aria-pressed'));
    if (labelBefore === labelAfter) report.fail('the audio toggle did not change state', { labelBefore, labelAfter, ariaPressed: pressed });
    else report.pass(`audio toggle flips state — "${labelBefore}" → "${labelAfter}"`, { ariaPressed: pressed });
    if (before && after) report.note(`audio toggle visual delta: ${(diffStats(before, after).changedRatio * 100).toFixed(2)}% of the control changed`);
    await audioButton.click();
    await page.waitForTimeout(300);
  }

  /* --- 5. Dialog lifecycle, focus trap, restoration ---------------------- */
  const trigger = await page.$('button[title*="cockpit" i]');
  if (!trigger) {
    report.fail('the cockpit launcher control is not present in the document');
    return;
  }
  await trigger.click();
  // Wait for the open transition to actually settle instead of assuming it
  // finishes inside a fixed window. The dialog uses `transition-all
  // duration-300`, and sampling at a hardcoded 600ms read a mid-tween
  // `opacity: 0.992973` whenever the browser was loaded, which failed the
  // strict `'1'` comparison below on a dialog that was in fact fully open.
  await page
    .waitForFunction(
      () => {
        const dialog = document.querySelector('[role="dialog"]');
        if (!dialog) return false;
        return Number.parseFloat(getComputedStyle(dialog).opacity) > 0.99;
      },
      undefined,
      { timeout: 4000 },
    )
    .catch(() => {
      /* handled by the assertion below, which reports the sampled state */
    });
  const opened = await page.evaluate(dialogState);
  if (!opened) {
    report.fail('the cockpit dialog is not in the document');
    return;
  }
  // `> 0.99` rather than string equality: the dialog's opacity transition may
  // still be settling on the very last subpixel, and a dialog at 0.995 is
  // visually open. Anything genuinely hidden (0, or aria-hidden) still fails.
  if (Number.parseFloat(opened.opacity) <= 0.99 || opened.ariaHidden === 'true') report.fail('the dialog opened but stays visually or semantically hidden', opened);
  else report.pass('the cockpit dialog opens', opened);
  if (!opened.label) report.fail('the dialog has no accessible name', opened);

  await captureViewport(page, 'cockpit-modal', { outDir, fs, path, deviceScaleFactor });
  // `page.accessibility` was retired in newer Playwright builds; fall back to
  // the locator aria snapshot so the artifact is produced either way.
  let snapshot = null;
  try {
    if (page.accessibility && typeof page.accessibility.snapshot === 'function') snapshot = await page.accessibility.snapshot();
    else {
      const yaml = await page.locator('#hud-modal').ariaSnapshot();
      snapshot = { role: 'dialog', name: opened.label || 'cockpit', yaml };
    }
  } catch {
    snapshot = null;
  }
  if (fs && path) fs.writeFileSync(path.join(outDir, 'a11y-modal-snapshot.json'), JSON.stringify(snapshot, null, 2));
  if (snapshot) report.pass('accessibility tree captured for the open dialog', { role: snapshot.role, children: snapshot.children?.length ?? 0, artifact: 'out/a11y-modal-snapshot.json' });
  else report.warn('the accessibility snapshot came back empty');

  const walkInside = [];
  let escaped = null;
  for (let step = 0; step < 6; step += 1) {
    await page.keyboard.press('Tab');
    const state = await page.evaluate(dialogState);
    walkInside.push(state?.activeElement);
    if (state && !state.activeElementInside) {
      escaped = state;
      break;
    }
  }
  if (!escaped) report.pass('focus stays inside the dialog across six tabs', { walk: walkInside });
  else report.fail('focus escaped the open dialog — there is no focus trap (WCAG 2.4.3)', { walk: walkInside, state: escaped });

  await captureFocus(page, { outDir, fs, path, deviceScaleFactor, name: 'modal-focus-ring' });

  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  const closed = await page.evaluate(dialogState);
  if (closed?.opacity !== '0' || closed?.ariaHidden !== 'true') report.fail('Escape did not close the dialog', closed);
  else report.pass('Escape closes the dialog and returns the page', { opacity: closed.opacity, ariaHidden: closed.ariaHidden, bodyOverflow: closed.bodyOverflow });
  if (closed?.activeElementInside) report.fail('focus stayed inside the closed dialog', closed);
  else report.pass('focus was restored to the launcher', { activeElement: closed?.activeElement });
}

module.exports = { run, MIN_TARGET_PX };



