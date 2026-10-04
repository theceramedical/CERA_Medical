#!/usr/bin/env node
/**
 * A client-JavaScript budget, enforced at build time.
 *
 * Run as the second half of `pnpm build`, so exceeding it fails the build rather than producing a
 * report nobody opens. PRD 10 asks for a performance budget, and a budget that is measured but not
 * enforced is a measurement.
 *
 * **Gzip, not raw.** What matters is the bytes on the wire, and a raw figure is roughly three times the
 * transferred size - so a raw budget is either far too loose to catch anything or gets set by whoever
 * last regenerated it. Brotli would be closer still to reality, but Caddy's compression settings are
 * Phase 13's and gzip is the floor every client supports; the ratio between the two is stable enough
 * that a gzip budget tracks a Brotli one.
 *
 * **Two numbers, because they fail differently.**
 *
 *   - The *shared* bundle is downloaded on every route by every visitor. A regression here is paid for
 *     on the first page load of the whole site, which is the number a content site lives or dies on.
 *   - The *total* is every chunk in the build. It catches the other shape of regression: a heavy
 *     dependency added to one route. That does not move the shared figure at all, so a shared-only
 *     budget would pass a build that made one page four times slower.
 *
 * Per-route transferred bytes are measured separately, in the browser, by `e2e/budget.spec.ts`. They are
 * not available here: Turbopack's `build-manifest.json` lists the shared root files and does not map
 * chunks to routes, so anything claiming to be a per-route figure derived from it would be a guess.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const NEXT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '.next');

/**
 * Budgets in kilobytes, gzipped.
 *
 * Set from the measured figures at the end of Phase 04 - 166 kB shared, 223 kB total - with roughly 15%
 * of headroom. The headroom is deliberate and bounded: enough that adding a component does not fail the
 * build, not enough that a second date library slips in unnoticed. They are meant to be *lowered* as
 * Phase 14 does its performance pass, not raised; raising one should be a considered change with a
 * reason in the commit message, which is why they are here and not in an environment variable.
 */
const BUDGETS_KB = {
  shared: 190,
  // Checkout (/cart, /checkout, return) adds client chunks; shared stayed within budget.
  total: 470,
};

function gzippedKb(paths) {
  const total = paths.reduce((sum, path) => sum + gzipSync(readFileSync(path)).length, 0);

  return total / 1024;
}

function sharedChunkPaths() {
  const manifest = JSON.parse(readFileSync(join(NEXT_DIR, 'build-manifest.json'), 'utf8'));

  /**
   * `rootMainFiles` plus `polyfillFiles`.
   *
   * The polyfills are a separate list in the manifest and are genuinely part of what every visitor
   * downloads, so omitting them would understate the shared cost by exactly the amount that is hardest
   * to notice.
   */
  const files = [...manifest.rootMainFiles, ...manifest.polyfillFiles];

  if (files.length === 0) {
    // A manifest shape change would otherwise report a shared bundle of 0 kB and pass for ever.
    throw new Error('build-manifest.json listed no shared client files - has its shape changed?');
  }

  return files.map((file) => join(NEXT_DIR, file));
}

function allChunkPaths() {
  const chunksDir = join(NEXT_DIR, 'static', 'chunks');

  return readdirSync(chunksDir, { recursive: true })
    .map(String)
    .filter((name) => name.endsWith('.js'))
    .map((name) => join(chunksDir, name));
}

const measured = {
  shared: gzippedKb(sharedChunkPaths()),
  total: gzippedKb(allChunkPaths()),
};

const failures = [];

for (const [name, budget] of Object.entries(BUDGETS_KB)) {
  const actual = measured[name];
  const verdict = actual > budget ? 'OVER' : 'ok';

  console.log(
    `${name.padEnd(7)} ${actual.toFixed(1).padStart(7)} kB gzip   budget ${String(budget).padStart(4)} kB   ${verdict}`,
  );

  if (actual > budget) {
    failures.push(
      `${name} client JavaScript is ${actual.toFixed(1)} kB gzipped, over the ${String(budget)} kB budget by ${(actual - budget).toFixed(1)} kB`,
    );
  }
}

if (failures.length > 0) {
  console.error('\nBundle budget exceeded:');
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error(
    '\nEither remove the weight, or raise the budget in apps/web/scripts/bundle-budget.mjs with a reason.',
  );
  process.exit(1);
}
