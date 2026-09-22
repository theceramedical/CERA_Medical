import { baseTestConfig } from '@cera/config/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseTestConfig,
  defineConfig({
    test: {
      // The base preset only picks up `.ts`. Component tests are `.tsx`.
      include: ['src/**/*.{test,spec}.{ts,tsx}'],

      coverage: {
        exclude: [
          // The token stylesheet has no executable lines, and `tokens.ts` is exercised
          // end-to-end by the contrast suite, which reads the real file.
          'src/styles/**',
        ],

        /**
         * Higher than the workspace default for `contrast.ts` specifically. It is the
         * arithmetic behind an accessibility claim in the PRD, and an untested branch in it
         * is a pairing reported as passing when it does not.
         */
        thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
      },
    },
  }),
);
