import baseTestConfig from '@cera/config/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseTestConfig,
  defineConfig({
    test: {
      // The API is the authorisation boundary (ADR-003), so it carries a higher
      // coverage floor than the platform default. Phase 14 raises it again once
      // the access-control matrix exists.
      coverage: {
        thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
      },
    },
  }),
);
