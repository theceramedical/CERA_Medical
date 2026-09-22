import baseTestConfig from '@cera/config/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseTestConfig,
  defineConfig({
    test: {
      // The worker performs every irreversible external call - CRM writes and
      // customer emails - so it carries a higher floor than the default.
      coverage: {
        thresholds: { lines: 80, functions: 80, branches: 75, statements: 80 },
      },
    },
  }),
);
