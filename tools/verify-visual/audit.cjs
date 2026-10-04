#!/usr/bin/env node
'use strict';

/**
 * PJP visual verification suite — entry point.
 *
 * The suite is a gate, not a log: it exits non-zero on the first regression and
 * every assertion is derived from rendered evidence. DOM state is read through
 * probes evaluated in the page; colour, grade and motion are measured from
 * decoded pixels. Nothing here reads a stylesheet's intentions — only what the
 * browser actually painted.
 *
 *   node tools/verify-visual/audit.cjs [--dist apps/docs/dist] [--out evidence]
 *                                      [--url http://localhost:5173] [--only scroller]
 *                                      [--device-scale-factor 2]
 *
 * Two browser sessions open side by side:
 *
 *   live     normal motion, Lenis + GSAP intact — reveals, the pinned portal and
 *            interaction are measured here, through the same smoothing an
 *            operator feels.
 *   reduced  prefers-reduced-motion: reduce — Lenis and the reveal choreography
 *            never mount, so scroll positions are exact and every node is in its
 *            composed resting state. Static measurement (contrast, style census)
 *            happens here.
 *
 * Evidence is written to tools/verify-visual/evidence: one PNG per recorded
 * frame, the contrast census as JSON, and summary.json for CI.
 */

const fs = require('node:fs');
const path = require('node:path');

const { resolvePlaywright, assertBrowserInstalled } = require('./lib/playwright.cjs');
const { startStaticServer } = require('./lib/static-server.cjs');
const session = require('./lib/session.cjs');
const report = require('./lib/report.cjs');
const { captureFrame } = require('./lib/screenshot.cjs');

const ROOT = path.resolve(__dirname, '../..');
const DEFAULT_DIST = path.join(ROOT, 'apps/docs/dist');
const DEFAULT_OUT = path.join(__dirname, 'evidence');

/** Order matters: grade consumes the frames every earlier check recorded. */
const CHECKS = [
  { name: 'reveal', title: 'REVEAL — entrance choreography', page: 'live' },
  { name: 'scroller', title: 'SCROLLER — pinned canvas hero, bands, optics', page: 'live' },
  { name: 'contrast', title: 'CONTRAST — AAA census at every scroll station', page: 'reduced' },
  { name: 'style-census', title: 'STYLE CENSUS — tokens, tracking, radius, colour', page: 'reduced' },
  { name: 'interaction', title: 'INTERACTION — hover, focus, modal, accessibility', page: 'live' },
  { name: 'pixel-health', title: 'GRADE — rendered pixels of every recorded frame', page: 'live' },
];

/**
 * Load the deck's Tailwind scale (an ESM module in a `type: module` package) so
 * the style census can measure rendered nodes against the real token table.
 */
async function loadScale() {
  const { pathToFileURL } = require('node:url');
  const configPath = path.join(ROOT, 'apps/docs/tailwind.config.js');
  try {
    const module = await import(pathToFileURL(configPath).href);
    const config = module.default || module;
    return config.theme && config.theme.extend ? config.theme.extend : null;
  } catch {
    return null;
  }
}

/** Console noise that is not this deck's to own. */
const IGNORED_CONSOLE = [/favicon/i, /ResizeObserver loop/i, /Download the React DevTools/i];

function parseArgs(argv) {
  const options = { dist: DEFAULT_DIST, out: DEFAULT_OUT, url: null, only: null, deviceScaleFactor: 2 };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === '--dist' && value) options.dist = path.resolve(ROOT, value);
    else if (flag === '--out' && value) options.out = path.resolve(ROOT, value);
    else if (flag === '--url' && value) options.url = value;
    else if (flag === '--only' && value) options.only = value;
    else if (flag === '--device-scale-factor' && value) options.deviceScaleFactor = Number(value);
    else if (flag.startsWith('--')) throw new Error(`unknown flag ${flag}`);
  }
  if (options.only && !CHECKS.some((check) => check.name === options.only)) {
    throw new Error(`unknown check "${options.only}" — known: ${CHECKS.map((check) => check.name).join(', ')}`);
  }
  return options;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const outDir = options.out;
  fs.mkdirSync(outDir, { recursive: true });

  let server = null;
  let baseUrl = options.url;
  if (!baseUrl) {
    if (!fs.existsSync(path.join(options.dist, 'index.html'))) {
      report.fail(`no build to audit at ${options.dist} — run \`pnpm --filter @pjp/docs build\` first (or pass --url)`);
      return report.summary();
    }
    server = await startStaticServer(options.dist);
    baseUrl = server.url;
  }

  const { chromium, source } = resolvePlaywright();
  if (!chromium) {
    report.fail('Playwright is not installed — run `pnpm add -D playwright` at the workspace root');
    if (server) await server.close();
    return report.summary();
  }
  report.title('BOOT');
  report.note(`playwright resolved from ${source}; serving ${baseUrl}`);

  const executablePath = assertBrowserInstalled(chromium);
  const browser = await chromium.launch({
    headless: true,
    executablePath: executablePath || undefined,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-lcd-text', '--force-color-profile=srgb'],
  });

  const live = await session.openPage(browser, { url: baseUrl, reducedMotion: 'no-preference', deviceScaleFactor: options.deviceScaleFactor });
  const reduced = await session.openPage(browser, { url: baseUrl, reducedMotion: 'reduce', deviceScaleFactor: options.deviceScaleFactor });
  await session.settleFonts(live.page);
  await session.settle(reduced.page);

  const scale = await loadScale();

  const frames = [];
  const base = {
    fs,
    path,
    outDir,
    dist: options.dist,
    baseUrl,
    deviceScaleFactor: options.deviceScaleFactor,
    session,
    report,
    frames,
    census: [],
    scale,
    /** WCAG allows a hair of slack for antialiasing at glyph edges. */
    aaaTolerance: 0.01,
    /** How long a hover style has to paint before the frame pair is taken. */
    hoverSettle: 420,
    livePage: live.page,
    reducedPage: reduced.page,
  };

  for (const check of CHECKS) {
    if (options.only && options.only !== check.name) continue;
    report.title(check.title);
    const page = check.page === 'reduced' ? reduced.page : live.page;
    const context = {
      ...base,
      page,
      captureFrame: (name, captureOptions) => captureFrame({ ...base, page }, name, captureOptions),
    };
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const module = require(path.join(__dirname, 'checks', `${check.name}.cjs`));
    await report.check(check.name, () => module.run(context));
  }

  report.title('CONSOLE');
  const problems = [...live.problems, ...reduced.problems].filter(
    (problem) => !IGNORED_CONSOLE.some((pattern) => pattern.test(problem)),
  );
  if (problems.length) {
    for (const problem of [...new Set(problems)].slice(0, 12)) report.fail(`browser reported ${problem}`);
  } else {
    report.pass('no console errors, page errors or failed requests in either session');
  }

  fs.writeFileSync(
    path.join(outDir, 'summary.json'),
    `${JSON.stringify(
      {
        baseUrl,
        viewport: session.VIEWPORT,
        deviceScaleFactor: options.deviceScaleFactor,
        passed: report.state.passed,
        failures: report.state.failures,
        warnings: report.state.warnings,
        frames: frames.map((frame) => ({ name: frame.name, kind: frame.kind, width: frame.image.width, height: frame.image.height })),
        contrastNodes: base.census.length,
      },
      null,
      2,
    )}\n`,
  );

  await browser.close();
  if (server) await server.close();

  report.note(`evidence written to ${path.relative(ROOT, outDir)}`);
  return report.summary();
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    process.stderr.write(`${error && error.stack ? error.stack : error}\n`);
    process.exit(1);
  });

