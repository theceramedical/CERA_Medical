import { defineConfig } from 'vitest/config';

/**
 * Shared Vitest base.
 *
 * Coverage thresholds are set per package rather than globally, because one
 * global number lets a weak area hide behind a strong one. Phase 14 raises
 * these for packages on the data-protection path.
 */
export const baseTestConfig = defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts', 'tests/**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**'],
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: { junit: './coverage/junit.xml' },

    // Fail rather than tolerate: a test-only console.error usually means an
    // unhandled rejection that the assertions did not notice.
    dangerouslyIgnoreUnhandledErrors: false,

    // Deterministic by default. Phase 14 shuffles order to prove isolation.
    sequence: { shuffle: false },
    testTimeout: 10_000,
    hookTimeout: 20_000,

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.*',
        '**/*.d.ts',
        '**/fixtures/**',
        '**/__tests__/**',
        '**/*.{test,spec}.ts',
        '**/migrations/**',
        '**/scripts/**',
      ],
      thresholds: { lines: 70, functions: 70, branches: 65, statements: 70 },
    },
  },
});

export default baseTestConfig;
