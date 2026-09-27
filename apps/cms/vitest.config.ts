import { baseTestConfig } from '@cera/config/vitest';
import { defineConfig, mergeConfig } from 'vitest/config';

export default mergeConfig(
  baseTestConfig,
  defineConfig({
    test: {
      include: ['src/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts'],
      coverage: { enabled: false },
    },
  }),
);
