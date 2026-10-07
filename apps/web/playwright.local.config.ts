import { defineConfig, devices } from '@playwright/test';

/**
 * Headed mobile checks against your running local stack (`pnpm dev` → :3000).
 *
 *   pnpm dev   # from repo root, in another terminal
 *   cd apps/web && pnpm test:local:mobile:headed
 */
const BASE_URL = process.env['PW_BASE_URL'] ?? 'http://localhost:3000';

const slowMo =
  process.env['PW_SLOW_MO'] === undefined ? 500 : Number.parseInt(process.env['PW_SLOW_MO'], 10);

const mobile = devices['Pixel 5'];
const channel = process.env['PW_CHANNEL'];

export default defineConfig({
  testDir: './e2e',
  timeout: 240_000,
  expect: { timeout: 20_000 },
  workers: 1,
  retries: 0,
  reporter: [['list']],

  use: {
    baseURL: BASE_URL,
    browserName: 'chromium',
    ...(channel === undefined || channel === '' ? {} : { channel }),
    headless: process.env['PW_HEADLESS'] === '1',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on',
    launchOptions: { slowMo },
    userAgent: mobile.userAgent,
    isMobile: mobile.isMobile,
    hasTouch: mobile.hasTouch,
    deviceScaleFactor: mobile.deviceScaleFactor,
    viewport: { width: 390, height: 844 },
  },
});
