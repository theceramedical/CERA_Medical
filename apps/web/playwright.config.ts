import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for `apps/web`.
 *
 * Two projects rather than one, because the accessibility suite and the end-to-end suite have
 * different costs and different audiences. `pnpm test:a11y` has to be runnable on its own in seconds
 * during design work; `pnpm test:e2e` grows through phases 07 to 12 and will not be.
 */

const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${String(PORT)}`;

export default defineConfig({
  testDir: './e2e',

  /**
   * Tests run against a production build, not `next dev`.
   *
   * Dev mode injects the error overlay, the hot-reload client, and a dev-tools indicator, all of which
   * add DOM that will never exist in production. The indicator in particular is a real focusable
   * button, so the focus walk below would report it and the reflow check would measure it. An axe run
   * over that is measuring the toolchain, not the product.
   *
   * `next start` forces `NODE_ENV=production`, which the `/dev/design` guard blocks on. Hence the
   * explicit opt-in: the flag is set here and nowhere else, and because it is an opt-in rather than an
   * opt-out, forgetting it in a deployment means the route 404s. See `src/app/dev/guard.ts`.
   */
  webServer: {
    command: `pnpm build && pnpm exec next start --port ${String(PORT)}`,
    url: BASE_URL,
    env: { CERA_ENABLE_DEV_ROUTES: '1' },
    /**
     * Not reused, even locally.
     *
     * A server left running from a previous run is serving the previous build, and an accessibility
     * suite that silently tests stale code is worse than a slow one - it reports a pass for a change
     * that was never compiled.
     */
    reuseExistingServer: false,
    timeout: 240_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  use: {
    baseURL: BASE_URL,
    /**
     * A trace on the first retry, not on every run.
     *
     * A failing axe assertion names the rule and the selector, which is usually enough. A failing
     * focus-order assertion is not - knowing that focus went somewhere unexpected is far less useful
     * than seeing where - and that is what the trace is for.
     */
    trace: 'on-first-retry',
  },

  /**
   * No retries locally.
   *
   * An accessibility violation is deterministic: the DOM either has the attribute or it does not, so
   * a retry can only hide a flaky test, never a flaky failure. One retry in CI covers the genuinely
   * timing-dependent parts - a server that has not finished starting, a font that has not swapped in.
   */
  retries: process.env['CI'] === undefined ? 0 : 1,

  // Serial in CI so the report is reproducible and the numbers in the phase document mean something.
  // Locally, a percentage rather than an omitted key: `exactOptionalPropertyTypes` rejects
  // `workers: undefined`, and '50%' is Playwright's own default for a machine with spare cores.
  workers: process.env['CI'] === undefined ? '50%' : 1,

  // A bare `test.only` left in a file would silently reduce the suite to one case.
  forbidOnly: process.env['CI'] !== undefined,

  reporter: process.env['CI'] === undefined ? [['list']] : [['list'], ['html', { open: 'never' }]],

  projects: [
    {
      name: 'a11y',
      testMatch: /.*\.a11y\.spec\.ts/,
      /**
       * Desktop Chromium only, and that is a deliberate limit rather than an oversight.
       *
       * axe-core's rules are engine-independent - they read the DOM and the computed styles, not
       * Chromium internals - so running the same ruleset in WebKit and Firefox would triple the
       * runtime to re-derive identical results. What genuinely differs between engines is rendering
       * and input behaviour, which is the E2E project's concern and Phase 14's cross-browser matrix.
       */
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'e2e',
      testMatch: /.*\.e2e\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual',
      testMatch: /.*\.visual\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        /**
         * Motion off, and that is what makes the baselines committable.
         *
         * Every transition in the design system is gated on `prefers-reduced-motion` already, so
         * emulating it removes the entire class of "the screenshot caught an element mid-fade" diff
         * without needing per-test animation handling. The cost is that the suite cannot see a
         * transition's resting state - which is fine, because a resting state is what it captures.
         */
        reducedMotion: 'reduce',
        // The viewport is set per test; this is only the value before the first `setViewportSize`.
        viewport: { width: 1280, height: 900 },
      },
      /**
       * A deterministic 1x raster.
       *
       * The default follows the host display, so a run on a HiDPI laptop produces baselines at twice
       * the resolution of the ones CI then compares against, and every test fails on size alone.
       */
      expect: { toHaveScreenshot: { scale: 'css' } },
    },
  ],
});
