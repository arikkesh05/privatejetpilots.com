'use strict';

/**
 * Style-tier census — the crown-jewel typography guard.
 *
 * The scale in `apps/docs/tailwind.config.js` is the single source of truth, so
 * this check reads the scale itself instead of repeating a list of sizes: every
 * node that paints ink must land on a token combination, and no display-tier
 * element may wear the tracking-label treatment.
 *
 * The historical bug is the last rule: `.text-display-hero`/`.text-headline-xl`
 * shipped with `tracking-[0.18em]`/`tracking-[0.2em]`, which turned a Syne
 * headline into scattered letters. Display sizes now require generous negative
 * tracking, and wide tracking belongs to the 11px label tier only.
 */

const { collectTextNodes } = require('../lib/page-probes.cjs');

/** Above this size a node is display tier; wide tracking there is the bug. */
const DISPLAY_TIER_PX = 16;
/** Wide-tracking definition: 0.1em and up is the label tier's territory. */
const WIDE_TRACKING_EM = 0.1;

function parsePx(value) {
  return value === 'normal' ? 0 : parseFloat(value) || 0;
}

function toEm(letterSpacingPx, fontSizePx) {
  if (!fontSizePx) return 0;
  return Number(((letterSpacingPx || 0) / fontSizePx).toFixed(4));
}

/**
 * Tracking a size tier *claims*, in em.
 *
 * A tier's `letterSpacing` is written in the unit the config author chose —
 * `label-caps` declares `'0.12em'`, not `'1.32px'` — so it cannot be run
 * through `toEm` the way a rendered measurement can. Dividing the literal
 * `0.12` by an 11px font size read `0.011em`, which is what made every
 * correctly tokenised node report as drift against the very token it came
 * from. Em values are taken as written; only absolute lengths are converted.
 */
function tierTrackingEm(letterSpacing, fontSizePx) {
  const raw = String(letterSpacing ?? '0em').trim();
  if (raw === 'normal') return 0;
  if (raw.endsWith('em')) return Number.parseFloat(raw) || 0;
  if (raw.endsWith('rem')) return (Number.parseFloat(raw) || 0) * 16;
  return toEm(parsePx(raw), fontSizePx);
}

/** Token combinations derived from the compiled scale, keyed by `${family}|${size}`. */
function tokenTable(scale) {
  const table = new Map();
  for (const [token, definition] of Object.entries(scale.fontSize)) {
    const [size, options = {}] = Array.isArray(definition) ? definition : [definition, {}];
    const tier = {
      token,
      letterSpacing: options.letterSpacing ?? '0em',
      fontWeight: options.fontWeight,
      lineHeight: options.lineHeight,
    };
    // Several tiers can share one size, so the table maps a size to the whole set of
    // tiers that claim it rather than to whichever was defined last.
    table.set(size, [...(table.get(size) || []), tier]);
  }
  return table;
}

function approvedFamilies(scale) {
  const families = new Set(['Material Symbols Outlined']);
  for (const list of Object.values(scale.fontFamily)) {
    const primary = Array.isArray(list) ? list[0] : list;
    if (typeof primary === 'string') families.add(primary.replace(/^["']|["']$/g, ''));
  }
  return families;
}

async function run(ctx) {
  const { page, report, scale } = ctx;
  if (!scale) {
    report.fail('style census skipped — the Tailwind scale could not be loaded from apps/docs/tailwind.config.js');
    return;
  }

  const tokens = tokenTable(scale);
  const approved = approvedFamilies(scale);
  const onScale = new Set(tokens.keys());

  const census = new Map();
  const violations = [];

  const survey = async (label) => {
    const nodes = await page.evaluate(collectTextNodes);
    for (const node of nodes) {
      const size = parseFloat(node.fontSize) || 0;
      const family = (node.fontFamily.split(',')[0] || '').replace(/^["']|["']$/g, '').trim();
      const tracking = toEm(parsePx(node.letterSpacing), size);
      const isIcon = node.isIcon;

      const key = `${family}|${node.fontSize}|${node.fontWeight}|${node.letterSpacing}`;
      const entry = census.get(key) || { count: 0, example: node.text, section: node.section, family, size: node.fontSize, weight: node.fontWeight, tracking: node.letterSpacing, tokens: [] };
      entry.count += 1;
      census.set(key, entry);

      const tiers = tokens.get(node.fontSize);
      if (tiers) entry.tokens.push(...tiers.map((tier) => tier.token));

      if (!isIcon && !approved.has(family)) {
        violations.push({ rule: 'off-scale family', node, detail: `${family || '(none)'} is not one of the approved faces (${[...approved].join(', ')})` });
      }
      if (!isIcon && size > 0 && !onScale.has(node.fontSize)) {
        violations.push({ rule: 'off-scale size', node, detail: `${node.fontSize} is not on the scale; nearest tokens: ${[...tokens.keys()].filter((s) => Math.abs(parseFloat(s) - size) <= 3).join(' ') || 'none'}` });
      }
      if (!isIcon && size >= DISPLAY_TIER_PX && tracking >= WIDE_TRACKING_EM) {
        violations.push({ rule: 'tracking drift (display tier wearing label tracking)', node, detail: `${node.letterSpacing} (${tracking.toFixed(3)}em) at ${node.fontSize}; display tier needs negative tracking — label tier is ${WIDE_TRACKING_EM}em at 14px and below` });
      }
      // A node is on-scale when *some* tier wearing its size also claims its tracking.
      // Several tiers legitimately share a size (label-caps and telemetry-sm are both
      // 11px at 0.12em and 0.08em), so measuring against one arbitrary claimant would
      // report perfectly tokenised copy as drift.
      if (tiers && !isIcon) {
        const claimed = tiers.some((tier) => Math.abs(tierTrackingEm(tier.letterSpacing, size) - tracking) <= 0.012);
        if (!claimed) {
          const nearest = tiers
            .map((tier) => ({ token: tier.token, tracking: tierTrackingEm(tier.letterSpacing, size) }))
            .sort((a, b) => Math.abs(a.tracking - tracking) - Math.abs(b.tracking - tracking))[0];
          violations.push({
            rule: 'tracking override of token',
            node,
            detail: `${node.text} wears ${tracking.toFixed(3)}em where ${tiers.map((tier) => tier.token).join(', ')} define ${tiers.map((tier) => tier.letterSpacing).join(', ')}; nearest is ${nearest.token} at ${nearest.tracking.toFixed(3)}em`,
          });
        }
      }
    }
    return nodes.length;
  };

  const firstPass = await survey('top');
  await ctx.session.scrollToRatio(page, 1);
  await ctx.session.settle(page);
  await survey('revealed');

  const combos = [...census.values()].sort((a, b) => b.count - a.count);
  report.note(`style census — ${combos.length} distinct font/size/weight/tracking combinations across ${firstPass} ink-bearing nodes (sampled twice: at rest and fully revealed)`);

  for (const combo of combos.slice(0, 10)) {
    const tokenNames = [...new Set(combo.tokens.map((t) => t))];
    report.note(`  ${combo.size} / ${combo.weight} / ${combo.tracking}${tokenNames.length ? ` = ${tokenNames.join('|')}` : ' = (no token claims this size)'} ×${combo.count} — "${combo.example}"`);
  }

  const unique = new Map();
  for (const violation of violations) {
    const key = `${violation.rule}|${violation.node.path}`;
    if (!unique.has(key)) unique.set(key, violation);
  }

  if (unique.size) {
    for (const violation of unique.values()) {
      report.fail(
        `style tier — ${violation.rule}: ${violation.detail}`,
        { text: violation.node.text, path: violation.node.path.slice(0, 96), size: violation.node.fontSize, weight: violation.node.fontWeight, tracking: violation.node.letterSpacing },
      );
    }
    return;
  }

  report.pass(`typography stays inside the scale — every painted node resolves to a token and no display element wears label tracking`);
}

module.exports = { run, DISPLAY_TIER_PX, WIDE_TRACKING_EM };
