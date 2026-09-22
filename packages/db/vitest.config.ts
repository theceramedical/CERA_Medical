import baseTestConfig from '@cera/config/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseTestConfig,
  defineConfig({
    test: {
      coverage: {
        /**
         * Two exclusions, both because a coverage percentage would be
         * meaningless rather than because the code is untested.
         *
         * `src/schema/**` is declarations: `pgTable(...)` calls with no branches.
         * They are verified by the migration SQL they generate and by the
         * constraint tests in `src/integration/`, which is a far stronger check
         * than "the module was imported".
         *
         * `src/migrate.ts` is a CLI whose behaviour is applying migrations to a
         * real database. It is exercised by the integration suite and by every CI
         * run; unit-testing it would mean mocking the migrator, which would
         * assert that the mock was called.
         */
        exclude: ['src/schema/**', 'src/migrate.ts', 'drizzle.config.ts', '**/*.test.ts'],
        thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
      },
    },
  }),
);
