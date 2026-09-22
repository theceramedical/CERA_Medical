import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadRootEnv } from '@cera/config/env/load';
import { sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

import { createDatabase } from './client.ts';

// Before anything reads `process.env`. Under Compose and in CI this finds no file
// and does nothing; from a terminal it is what makes `DATABASE_URL` present.
loadRootEnv();

/**
 * The migration runner for `cera_app`.
 *
 * Deliberately a script rather than something the API does at startup. In Phase 13
 * the API and worker start concurrently, and two containers running migrations
 * against one database at the same time is a real failure mode - the second sees a
 * half-applied migration and either fails or, worse, succeeds against a schema
 * that is momentarily inconsistent. A deploy runs this once, before either service
 * starts.
 *
 * `--status` reports without applying, which is what CI uses to assert no drift.
 */

const MIGRATIONS_FOLDER = join(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');

/**
 * A fixed key for a Postgres session-level advisory lock.
 *
 * Belt and braces alongside running this once per deploy: if two invocations do
 * overlap - a retried deploy step, a developer running `pnpm migrate` while CI
 * does - the second blocks until the first finishes rather than interleaving.
 * Drizzle's own migrator does not take one.
 */
const MIGRATION_LOCK_KEY = 4_820_931_7;

interface AppliedMigration {
  hash: string;
  created_at: string;
}

async function listMigrationFiles(): Promise<string[]> {
  const entries = await readdir(MIGRATIONS_FOLDER).catch(() => []);
  return entries.filter((name) => name.endsWith('.sql')).sort();
}

async function readApplied(
  db: ReturnType<typeof createDatabase>['db'],
): Promise<AppliedMigration[]> {
  /**
   * Drizzle records applied migrations in `drizzle.__drizzle_migrations`. Reading
   * it directly, and tolerating its absence, is what lets `--status` work on a
   * database that has never been migrated - the case where a helpful message
   * matters most.
   */
  const result = await db
    .execute(
      sql`select hash, created_at::text as created_at
          from drizzle.__drizzle_migrations
          order by created_at`,
    )
    .catch(() => ({ rows: [] as AppliedMigration[] }));

  return result.rows as AppliedMigration[];
}

async function main(): Promise<void> {
  const statusOnly = process.argv.includes('--status');
  const connectionString = process.env.DATABASE_URL;

  if (connectionString === undefined || connectionString.length === 0) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
    process.exitCode = 1;
    return;
  }

  const handle = createDatabase({
    connectionString,
    maxConnections: 1,
    application: 'cera-migrate',
    /**
     * Migrations legitimately take longer than a request. A 10-second statement
     * timeout would abort an index build on a populated table and leave the
     * migration half-applied, which is the one outcome worth engineering against.
     */
    statementTimeoutMs: 600_000,
  });

  try {
    const files = await listMigrationFiles();

    if (files.length === 0) {
      console.log('No migration files found. Run `pnpm --filter @cera/db generate` first.');
      return;
    }

    const applied = await readApplied(handle.db);

    if (statusOnly) {
      const pending = files.length - applied.length;

      console.log(`Migration files: ${String(files.length)}`);
      console.log(`Applied:         ${String(applied.length)}`);

      if (pending > 0) {
        console.error(`Pending:         ${String(pending)}`);
        // A non-zero exit is what makes this usable as a CI gate: a pending
        // migration on main means someone generated SQL and did not apply it.
        process.exitCode = 1;
        return;
      }

      console.log('Pending:         0');
      return;
    }

    await handle.db.execute(sql`select pg_advisory_lock(${MIGRATION_LOCK_KEY})`);

    try {
      await migrate(handle.db, { migrationsFolder: MIGRATIONS_FOLDER });
      console.log(`Applied migrations. ${String(files.length)} file(s) on disk.`);
    } finally {
      // Released explicitly rather than relying on session end, so a pooled
      // connection cannot be returned still holding it.
      await handle.db.execute(sql`select pg_advisory_unlock(${MIGRATION_LOCK_KEY})`);
    }
  } catch (error) {
    console.error('Migration failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await handle.close();
  }
}

await main();
