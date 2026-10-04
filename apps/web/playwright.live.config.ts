import { defineConfig, devices } from '@playwright/test';

/**
 * Interactive / headed runs against your **running** local stack (`pnpm dev` on :3000, real API
 * and Authentik). No stub webServer — you start apps yourself, then use Playwright UI or headed mode.
 *
 *   pnpm stack:up && pnpm dev
 *   pnpm test:live:ui
 */
const BASE_URL = process.env['PW_BASE_URL'] ?? 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.manual\.spec\.ts/,
  timeout: 120_000,
  expect: { timeout: 15_000 },

  use: {
    baseURL: BASE_URL,
    headless: false,
    trace: 'on',
    video: 'on',
    screenshot: 'on',
    launchOptions: {
      slowMo: process.env['PW_SLOW_MO'] === undefined ? 0 : Number(process.env['PW_SLOW_MO']),
    },
    ...devices['Desktop Chrome'],
  },

  workers: 1,
  retries: 0,
  reporter: [['list']],

  projects: [{ name: 'live', testMatch: /.*\.manual\.spec\.ts/ }],
});
