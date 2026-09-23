import { baseTestConfig } from '@cera/config/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseTestConfig,
  defineConfig({
    test: {
      include: ['src/**/*.{test,spec}.{ts,tsx}'],

      coverage: {
        // Route files and the layout are covered by Playwright in Phase 03 WP-03.8 and Phase 14,
        // not here. Unit coverage thresholds over a page component measure nothing useful.
        enabled: false,
      },
    },
  }),
);
