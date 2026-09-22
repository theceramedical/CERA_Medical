import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import * as schema from './schema/index.ts';

/**
 * The pool factory. One per process, created at startup and closed on shutdown.
 *
 * A factory rather than a module-level singleton: a singleton connects on import,
 * which means importing a type from this package would open a socket, and a test
 * that imports the schema would need a live database. Explicit construction keeps
 * the connection where the lifecycle is managed.
 */

export type Database = NodePgDatabase<typeof schema>;

export interface CreateDatabaseOptions {
  connectionString: string;
  /**
   * Per-process ceiling.
   *
   * Sized deliberately low by default. Postgres 18 handles a few hundred
   * connections, but this platform runs the API, the worker, Payload, Vendure,
   * Authentik, and GlitchTip against one instance, and Authentik dropped Redis in
   * 2025.10 so it now needs roughly 50% more connections than it used to. The sum
   * of the pools is what matters, not any one of them.
   */
  maxConnections?: number;
  /**
   * Applied to every connection.
   *
   * Without it, a query that blocks - a lock held by a long transaction, a bad
   * plan on a large table - occupies a pool slot indefinitely, and the pool
   * exhausts. A hung request is then indistinguishable from a down database.
   */
  statementTimeoutMs?: number;
  application?: string;
}

export interface DatabaseHandle {
  db: Database;
  pool: pg.Pool;
  close: () => Promise<void>;
}

export function createDatabase(options: CreateDatabaseOptions): DatabaseHandle {
  const pool = new pg.Pool({
    connectionString: options.connectionString,
    max: options.maxConnections ?? 10,
    /** Fail fast rather than queue forever when the database is unreachable. */
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    /**
     * Shows up in `pg_stat_activity`, which is what makes "who is holding this
     * lock" answerable during an incident rather than a guess between six
     * services sharing one instance.
     */
    application_name: options.application ?? 'cera',
    statement_timeout: options.statementTimeoutMs ?? 10_000,
  });

  /**
   * An idle-client error is emitted on the pool, not on a query, so without this
   * handler a dropped connection during a deploy or a Postgres restart becomes an
   * unhandled `error` event and takes the process down.
   */
  pool.on('error', (error) => {
    console.error('[db] idle client error', error.message);
  });

  return {
    db: drizzle(pool, { schema }),
    pool,
    close: async () => {
      await pool.end();
    },
  };
}

export { schema };
