'use strict';

/**
 * Playwright is not linked at the workspace root — it arrives transitively
 * through the MCP server devDependency — so it has to be resolved out of the
 * pnpm store. Every installed version is tried, newest first, and the browser
 * executable is verified before anything is asked of it.
 */

const fs = require('node:fs');
const path = require('node:path');

function semverDesc(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    const diff = (pb[i] || 0) - (pa[i] || 0);
    if (diff) return diff;
  }
  return 0;
}

const WORKSPACE_ROOT = path.resolve(__dirname, '..', '..', '..');

function resolvePlaywright(rootDir = WORKSPACE_ROOT) {
  const store = path.join(rootDir, 'node_modules', '.pnpm');

  let entries = [];
  try {
    entries = fs.readdirSync(store);
  } catch {
    throw new Error(`pnpm store not found at ${store} — run pnpm install first`);
  }

  const versions = entries
    .filter((name) => /^playwright@\d/.test(name))
    .map((name) => name.slice('playwright@'.length))
    .sort(semverDesc);

  const tried = [];
  let fallback = null;

  for (const version of versions) {
    const specifier = path.join(store, `playwright@${version}`, 'node_modules', 'playwright');
    try {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const mod = require(specifier);
      if (!mod || !mod.chromium) continue;
      const candidate = { chromium: mod.chromium, version, source: specifier };
      // Newest first, but a copy whose browser binary was never downloaded cannot
      // launch — keep it as the last resort so the error message stays useful.
      let executable = null;
      try {
        executable = mod.chromium.executablePath();
      } catch {
        executable = null;
      }
      if (executable && fs.existsSync(executable)) return candidate;
      if (!fallback) fallback = candidate;
      tried.push(`${version} (no browser)`);
    } catch {
      tried.push(version);
    }
  }

  if (fallback) return fallback;

  throw new Error(
    `playwright not resolvable from ${store} (tried: ${tried.join(', ') || 'no playwright@* directories'}). Run pnpm install.`,
  );
}

function assertBrowserInstalled(chromium, version) {
  let executable = null;
  try {
    executable = chromium.executablePath();
  } catch {
    executable = null;
  }
  if (executable && !fs.existsSync(executable)) {
    throw new Error(
      `chromium executable for playwright@${version} is missing (${executable}). Install it with: pnpm dlx playwright@${version} install chromium`,
    );
  }
  return executable;
}

module.exports = { resolvePlaywright, assertBrowserInstalled };
