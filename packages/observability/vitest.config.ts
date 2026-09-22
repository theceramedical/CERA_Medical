import baseTestConfig from '@cera/config/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseTestConfig,
  defineConfig({
    test: {
      coverage: {
        // Redaction is the guarantee this package exists to provide, so a gap in
        // its coverage is a gap in that guarantee. Highest floor alongside
        // contracts.
        exclude: ['src/index.ts', '**/*.test.ts'],
        thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
      },
    },
  }),
);
