import { baseTestConfig } from '@cera/config/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

/**
 * Two projects, because this package tests two different kinds of thing.
 *
 * `tokens.ts` and the contrast gate read `theme.css` off disk and want Node. Components want a
 * DOM. Splitting them keeps jsdom's setup cost - roughly a second per file - off the suites
 * that gain nothing from it, while a component test still gets a DOM without anyone
 * remembering to add a `@vitest-environment` pragma.
 *
 * Projects rather than `environmentMatchGlobs`, which was removed in Vitest 4. The failure
 * when it is left in place is quiet: the option is ignored, every file runs in the default
 * environment, and component tests fail with `document is not defined` rather than with
 * anything pointing at the config.
 */
export default mergeConfig(
  baseTestConfig,
  defineConfig({
    test: {
      coverage: {
        exclude: [
          // The token stylesheet has no executable lines, and `tokens.ts` is exercised
          // end-to-end by the contrast suite, which reads the real file.
          'src/styles/**',
        ],

        /**
         * Higher than the workspace default. `contrast.ts` is the arithmetic behind an
         * accessibility claim in the PRD, and an untested branch in it is a pairing reported
         * as passing when it does not.
         */
        thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
      },

      /**
       * Split by `exclude` rather than by `include`.
       *
       * `extends: true` concatenates array options with the inherited ones rather than
       * replacing them, so setting `include: ['**\/*.test.tsx']` on a project does not narrow
       * it - the inherited `.ts` glob is still there and the project runs every file twice
       * across the two environments. That reads as a passing suite with a suspiciously high
       * test count, which is easy to miss.
       */
      projects: [
        {
          extends: true,
          test: {
            name: 'tokens',
            environment: 'node',
            exclude: ['src/**/*.test.tsx'],
          },
        },
        {
          extends: true,
          test: {
            name: 'components',
            environment: 'jsdom',
            include: ['src/**/*.test.tsx'],
            exclude: ['src/**/*.test.ts'],
            setupFiles: ['./vitest.setup.ts'],
          },
        },
      ],
    },
  }),
);
