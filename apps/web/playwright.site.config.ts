import { defineConfig, devices } from '@playwright/test';

/**
 * Headed mobile walkthrough on the **live** site (not localhost).
 *
 *   cd apps/web && pnpm test:site:mobile:walkthrough
 *
 * Opens Chromium with a phone-sized viewport, slow-mo clicks, video + screenshots.
 *
 *   PW_BASE_URL=https://ceramedical.org   (default)
 *   PW_SLOW_MO=800                        (ms between actions, default 650)
 *   PW_CHANNEL=chrome                     (use Google Chrome instead of bundled Chromium)
 *   PW_HEADLESS=1                         (only if you have no display — not for normal use)
 */
const BASE_URL = process.env['PW_BASE_URL'] ?? 'https://ceramedical.org';

const slowMo =
  process.env['PW_SLOW_MO'] === undefined ? 650 : Number.parseInt(process.env['PW_SLOW_MO'], 10);

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
