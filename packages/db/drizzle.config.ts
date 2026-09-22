import { defineConfig } from 'drizzle-kit';

/**
 * `drizzle-kit` configuration for the `cera_app` database.
 *
 * `strict` and `verbose` are both on: generation prints the SQL it is about to
 * write and asks before a destructive statement. PRD 10 requires forward-only,
 * backward-compatible migrations, and the most common way that rule gets broken is
 * an unreviewed `drop column` generated from a rename.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema/index.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://cera_app@localhost:5432/cera_app',
  },
  strict: true,
  verbose: true,
  /**
   * Only this database. Payload owns `cera_cms` and Vendure owns `cera_commerce`,
   * each with its own migration tool, and a wildcard here would make drizzle-kit
   * propose dropping every table it did not generate.
   */
  schemaFilter: ['public'],
});
