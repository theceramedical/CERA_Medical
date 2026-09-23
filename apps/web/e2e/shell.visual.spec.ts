import { expect, test } from '@playwright/test';

import { VIEWPORT_HEIGHT, VIEWPORT_WIDTHS, VISUAL_ROUTES } from './support/routes.ts';

import type { Page } from '@playwright/test';

/**
 * Visual baselines for the shell and the homepage - WP-04.4.
 *
 * What this suite is for, and what it is not. It is a regression net: it answers "did this commit change
 * how anything looks, and did I mean to". It is *not* a fidelity check against the reference image - a
 * machine cannot tell whether a 6px difference in section padding is a defect or a decision. The
 * comparison against the reference is done by eye at 1280 and written up in
 * `.planning/phase-04-web-shell-homepage.md`; these baselines then hold that agreed result still.
 *
 * Which means the baselines are only worth committing if they are stable. Fonts, animation, and lazily
 * loaded images all make a screenshot differ from itself between runs, and a suite that fails at random
 * gets its baselines regenerated without being looked at, at which point it is worse than nothing. Hence
 * `settle()` below, and hence the reduced-motion emulation in the project config.
 */

/**
 * Waits until the page has stopped changing on its own.
 *
 * Three separate sources of drift, each of which will produce a diff on an unmodified page:
 *
 *   - Web fonts. `next/font` preloads them, but the swap still lands after first paint, and a screenshot
 *     taken during it captures the metric-adjusted fallback instead.
 *   - Lazily loaded images. Everything below the fold has `loading="lazy"`, so it is absent from a
 *     full-page screenshot unless the page has been scrolled through first.
 *   - Transitions. Reduced motion is emulated, which removes ours, but the scroll-shadow on the header
 *     is driven by a listener rather than a transition and needs the scroll to have settled.
 */
async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;

    // Scroll to the bottom in viewport-sized steps so every lazy image enters the viewport and starts
    // loading. A single jump to the end skips past anything in the middle.
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          resolve(undefined);
        });
      });
    }

    window.scrollTo(0, 0);
  });

  /**
   * Wait on the images themselves, not on the network going quiet.
   *
   * `waitForLoadState('networkidle')` is the obvious thing here and it is wrong: it waits for a
   * 500ms gap in *all* requests, and a streamed RSC response or any kept-alive connection means that
   * gap may never arrive. It timed out on exactly one of the twenty-five captures, which is the worst
   * possible failure rate - frequent enough to break a run, rare enough to look like a real diff.
   *
   * `complete` covers loaded-or-failed, so a missing image does not hang here; it shows up as a broken
   * image in the baseline, which is a visual regression and belongs in the diff rather than in a timeout.
   */
  await page.waitForFunction(
    () => [...document.querySelectorAll('img')].every((image) => image.complete),
    undefined,
    { timeout: 15_000 },
  );

  // Decoding is not covered by `complete`, and an undecoded image paints as nothing.
  await page.evaluate(async () => {
    await Promise.all(
      [...document.querySelectorAll('img')].map(async (image) => {
        try {
          await image.decode();
        } catch {
          // A decode rejects for an image that failed to load. Already handled above; not a hang.
        }
      }),
    );
  });
}

for (const route of VISUAL_ROUTES) {
  for (const width of VIEWPORT_WIDTHS) {
    const name = route === '/' ? 'home' : route.replaceAll('/', '-').slice(1);

    test(`${name} at ${String(width)}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
      await page.goto(route);
      await settle(page);

      await expect(page).toHaveScreenshot(`${name}-${String(width)}.png`, {
        fullPage: true,
        /**
         * A small per-pixel and whole-image tolerance.
         *
         * Font rasterisation and gradient dithering differ by a shade or two between a local run and the
         * CI container even with identical fonts installed, and 0 would fail on that. 0.2% of the image
         * is still far below anything a person would call a layout change - on a 1280x4000 homepage it is
         * about 10,000 pixels, roughly a single word moving - so a real regression stays visible.
         */
        maxDiffPixelRatio: 0.002,
        threshold: 0.2,
      });
    });
  }
}

test('the content container stops growing past its maximum', async ({ page }) => {
  /**
   * The assertion behind the 1280 and 1440 baselines, stated as a number.
   *
   * A screenshot pair shows this, but only to someone who opens both and measures. The reference's layout
   * is a bounded column centred in the viewport, and the failure - a container set to a percentage
   * somewhere in the tree - looks entirely reasonable at every width below the one where it stops being.
   */
  const widthAt = async (viewport: number): Promise<number> => {
    await page.setViewportSize({ width: viewport, height: VIEWPORT_HEIGHT });
    await page.goto('/about');

    return page.evaluate(() => {
      const heading = document.querySelector('h1');
      if (heading === null) throw new Error('/about has no h1 to measure against');

      return heading.getBoundingClientRect().width;
    });
  };

  const at1280 = await widthAt(1280);
  const at1920 = await widthAt(1920);

  expect(at1920).toBeCloseTo(at1280, 0);
});
