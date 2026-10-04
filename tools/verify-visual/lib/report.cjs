'use strict';

/**
 * Tiny pass/fail ledger. The suite is a gate, not a log: every assertion lands
 * in exactly one bucket and the process exit code is derived from the failures.
 */

const useColour = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (text) => (useColour ? `\u001b[${code}m${text}\u001b[0m` : String(text));

const styles = {
  dim: paint('2'),
  bold: paint('1'),
  red: paint('31'),
  green: paint('32'),
  yellow: paint('33'),
  cyan: paint('36'),
};

const state = {
  section: '',
  passed: 0,
  failures: [],
  warnings: [],
  notes: [],
  startedAt: Date.now(),
};

function title(text) {
  state.section = text;
  process.stdout.write(`\n${styles.bold(styles.cyan(text))}\n`);
}

function pass(message) {
  state.passed += 1;
  process.stdout.write(`  ${styles.green('PASS')}  ${message}\n`);
}

function fail(message, expected) {
  state.failures.push({ section: state.section, message, expected });
  process.stdout.write(`  ${styles.red('FAIL')}  ${message}\n`);
  if (expected !== undefined) {
    process.stdout.write(`        ${styles.dim(JSON.stringify(expected))}\n`);
  }
}

function warn(message) {
  state.warnings.push({ section: state.section, message });
  process.stdout.write(`  ${styles.yellow('WARN')}  ${message}\n`);
}

function note(message) {
  state.notes.push({ section: state.section, message });
  process.stdout.write(`  ${styles.dim(`note  ${message}`)}\n`);
}

/** Run an assertion body, converting a thrown error or missing browser into a failure. */
async function check(label, body) {
  try {
    await body();
  } catch (error) {
    fail(`${label} — audit harness error`, String((error && error.message) || error));
  }
}

function summary() {
  const seconds = ((Date.now() - state.startedAt) / 1000).toFixed(1);
  process.stdout.write(`\n${styles.bold('summary')}\n`);
  process.stdout.write(`  ${styles.green(`${state.passed} passed`)}  ${state.failures.length ? styles.red(`${state.failures.length} failed`) : '0 failed'}  ${state.warnings.length ? styles.yellow(`${state.warnings.length} warning(s)`) : '0 warnings'}  ${styles.dim(`${seconds}s`)}\n`);

  if (state.failures.length) {
    process.stdout.write(`\n${styles.red(styles.bold('regressions'))}\n`);
    for (const failure of state.failures) {
      process.stdout.write(`  ${styles.red('x')} [${failure.section}] ${failure.message}\n`);
    }
    process.stdout.write(`\n${styles.red('visual verification failed')}\n`);
    return 1;
  }
  process.stdout.write(`\n${styles.green('visual verification passed — zero regressions')}\n`);
  return 0;
}

module.exports = { title, pass, fail, warn, note, check, summary, state, styles };
