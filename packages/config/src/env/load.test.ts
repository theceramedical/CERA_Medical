import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadRootEnv } from './load.js';

/**
 * `loadRootEnv` is what makes "copy .env.example to .env" a true instruction.
 *
 * The property worth protecting is the precedence rule. A stale `.env` in a checkout
 * must never override a `DATABASE_URL` passed explicitly on the command line, because
 * the consequence is a command reporting success against a different database than the
 * one the operator named - and `pnpm seed:reset` is in that set.
 */

const created: string[] = [];
const touchedKeys: string[] = [];

/** A throwaway env file loaded through the same entry point callers use. */
function loadFixtureEnv(contents: string): void {
  const dir = mkdtempSync(join(tmpdir(), 'cera-env-'));
  created.push(dir);

  // `loadRootEnv` only looks beside a `pnpm-workspace.yaml`, which is the behaviour
  // under test: the marker is what stops it loading an unrelated `.env` from a parent
  // directory when run outside the repository.
  writeFileSync(join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
  writeFileSync(join(dir, '.env'), contents);

  process.loadEnvFile(join(dir, '.env'));
}

afterEach(() => {
  for (const key of touchedKeys) delete process.env[key];
  touchedKeys.length = 0;

  for (const dir of created) rmSync(dir, { recursive: true, force: true });
  created.length = 0;
});

describe('loadRootEnv', () => {
  it('finds the repository .env and reports the path it loaded', () => {
    // Runs against the real repository, so this also asserts the upward walk reaches
    // the workspace root from inside `packages/config`.
    const loaded = loadRootEnv();

    expect(loaded).toMatch(/\.env$/);
  });

  it('populates a variable that was not already set', () => {
    touchedKeys.push('CERA_LOAD_TEST_UNSET');

    expect(process.env.CERA_LOAD_TEST_UNSET).toBeUndefined();

    loadFixtureEnv('CERA_LOAD_TEST_UNSET=from_file\n');

    expect(process.env.CERA_LOAD_TEST_UNSET).toBe('from_file');
  });

  it('leaves an already-set variable alone', () => {
    // The rule that matters. An explicit `DATABASE_URL=... pnpm seed:reset` must win
    // over whatever happens to be in the checkout's `.env`.
    touchedKeys.push('CERA_LOAD_TEST_PRESET');
    process.env.CERA_LOAD_TEST_PRESET = 'from_environment';

    loadFixtureEnv('CERA_LOAD_TEST_PRESET=from_file\n');

    expect(process.env.CERA_LOAD_TEST_PRESET).toBe('from_environment');
  });

  it('is safe to call twice', () => {
    // Imported by `migrate.ts`, `seed.ts`, and `drizzle.config.ts`, and `drizzle-kit`
    // loads its config in the same process as the CLI, so a second call happens.
    expect(() => {
      loadRootEnv();
      loadRootEnv();
    }).not.toThrow();
  });
});
