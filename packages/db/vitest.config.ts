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
         * `src/migrate.ts` and `src/seed.ts` are CLIs whose behaviour is changing a
         * real database. They are exercised by the integration suite and by every CI
         * run; unit-testing them would mean mocking the migrator or the driver, which
         * would assert that the mock was called.
         *
         * The one part of the seeder that cannot be verified by running it - the
         * guard that refuses to seed production - is in `src/seed-guard.ts` precisely
         * so it is covered here rather than excluded with the CLI around it.
         */
        exclude: [
          'src/schema/**',
          'src/migrate.ts',
          'src/seed.ts',
          'drizzle.config.ts',
          '**/*.test.ts',
        ],
        thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
      },
    },
  }),
);
