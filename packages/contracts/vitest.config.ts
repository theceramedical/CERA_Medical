import baseTestConfig from '@cera/config/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseTestConfig,
  defineConfig({
    test: {
      // Contracts are imported by every app, so a gap here propagates
      // everywhere. This is the highest floor in the monorepo.
      coverage: {
        thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
      },
    },
  }),
);
