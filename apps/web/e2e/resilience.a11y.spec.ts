import { expect, test } from '@playwright/test';

import { expectNoViolations } from './support/axe.ts';

import type { Page } from '@playwright/test';

/**
 * Zoom, reflow, reduced motion, and forced colours - WP-03.8.
 *
 * The four conditions a design system is most likely to break under, and the four nobody looks at while
 * building it. They share a shape: the page has to stay usable when the user changes something about
 * how it is presented, and the failures are silent at the default settings everyone develops against.
 */

const PREVIEW = '/dev/design';

/** Whether the document scrolls horizontally, which is the reflow failure. */
async function hasHorizontalScroll(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement;

    // One pixel of tolerance. Sub-pixel layout rounding produces a fractional overflow on perfectly
    // correct pages, and a test that fails on 0.4px is a test that gets disabled.
    return scrollWidth - clientWidth > 1;
  });
}

/**
 * Names the elements responsible for the document being too wide.
 *
 * Nodes inside a scrollable ancestor are skipped, and that exclusion is what makes the output usable.
 * A data table inside its own scroll region is *meant* to be wider than the viewport - that is the
 * SC 1.4.10 exemption working - so without the filter the table, its head, its body, and every cell
 * flood the list and bury whatever is actually at fault.
 */
async function overflowingElements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const limit = document.documentElement.clientWidth;

    /** Whether some ancestor absorbs horizontal overflow on this node's behalf. */
    const insideScroller = (node: Element): boolean => {
      let parent = node.parentElement;

      while (parent !== null && parent !== document.body) {
        const overflowX = getComputedStyle(parent).overflowX;

        if (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') return true;

        parent = parent.parentElement;
      }

      return false;
    };

    return [...document.querySelectorAll('body *')]
      .filter((node) => {
        const { width, left } = node.getBoundingClientRect();

        // `left + width` rather than width alone, so an element pushed off the right edge is caught
        // even when it is narrow.
        return width > 0 && left + width > limit + 1 && !insideScroller(node);
      })
      .slice(0, 10)
      .map((node) => {
        const classes = node.className.toString().split(/\s+/).slice(0, 4).join('.');

        return `${node.tagName.toLowerCase()}${classes === '' ? '' : `.${classes}`}`;
      });
  });
}

test.describe('zoom to 200%', () => {
  /**
   * SC 1.4.4 Resize Text.
   *
   * Emulated by halving the viewport at a device scale factor of 2 rather than by scaling the font
   * size, because that is what a browser zoom actually does: every CSS pixel gets bigger, so media
   * queries and container queries re-evaluate. Scaling only the root font size tests something else and
   * passes in cases real zoom fails.
   */
  test('has no horizontal scroll and no clipping', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 512 });
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    const overflowing = await overflowingElements(page);

    expect(await hasHorizontalScroll(page), `Overflowing: ${overflowing.join(', ')}`).toBe(false);
  });

  test('still reports no accessibility violations', async ({ page }) => {
    // Worth re-running rather than assuming: target size and contrast are both computed from rendered
    // geometry, and a layout that only reflows at one width can fail either.
    await page.setViewportSize({ width: 640, height: 512 });
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    await expectNoViolations(page);
  });
});

test.describe('reflow at 400%', () => {
  /**
   * SC 1.4.10 Reflow: 320 CSS pixels wide with no two-dimensional scrolling.
   *
   * 320px is 1280px at 400% zoom, which is the criterion's own arithmetic. The tables are the
   * interesting case - a data table genuinely cannot reflow, which is why it lives in a named,
   * focusable scroll region rather than being allowed to stretch the document.
   */
  test('the document does not scroll horizontally at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    const overflowing = await overflowingElements(page);

    expect(await hasHorizontalScroll(page), `Overflowing: ${overflowing.join(', ')}`).toBe(false);
  });

  /**
   * SC 1.4.10 exempts content that genuinely needs a two-dimensional layout, and a six-column data
   * table is the standard example. The exemption applies to the table, not to the document: the
   * overflow has to be absorbed by the table's own named, focusable region so the page itself never
   * scrolls sideways.
   *
   * This is the assertion that found the real bug. `overflow-x-auto` on the wrapper was not enough,
   * because a flex item defaults to `min-width: auto` and refuses to shrink below its content - so the
   * wrapper grew to the table's intrinsic width and dragged the document with it.
   */
  test('a wide table keeps its overflow inside its own region', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    const regions = page.getByRole('region', { name: /scrollable/ });
    const count = await regions.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const region = regions.nth(index);

      // Able to scroll, whether or not it currently needs to. A region that clips instead would hide
      // columns with no way to reach them.
      expect(await region.evaluate((node) => getComputedStyle(node).overflowX)).toBe('auto');

      // And never wider than the viewport, which is what would push the document sideways.
      const { width } = (await region.boundingBox()) ?? { width: 0 };
      expect(width).toBeLessThanOrEqual(320);
    }

    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  test('still reports no accessibility violations', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    await expectNoViolations(page);
  });
});

test.describe('prefers-reduced-motion', () => {
  test.use({ colorScheme: 'light', reducedMotion: 'reduce' });

  /**
   * SC 2.3.3, and a vestibular-safety concern beyond conformance.
   *
   * `theme.css` suppresses motion globally with a media query, which is the right level - a
   * per-component opt-in means the one component somebody forgets is the one that triggers nausea.
   *
   * The threshold is "imperceptible", not zero, and that is the implementation's choice rather than a
   * concession. The reset collapses every duration to `0.01ms` instead of `0s` because a zero-duration
   * animation does not fire `animationend` in every engine, and any code waiting on that event hangs
   * for a user who asked for less motion - which is the one user who must not get a broken page.
   * `animation-iteration-count: 1` is what stops the collapsed animation from looping.
   */
  const PERCEPTIBLE_MS = 1;

  test('leaves no perceptible animation or transition', async ({ page }) => {
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    const moving = await page.evaluate((threshold) => {
      /** The longest duration in a comma-separated list, in milliseconds. */
      const longest = (value: string): number =>
        value
          .split(',')
          .map((part) => {
            const trimmed = part.trim();
            const amount = Number.parseFloat(trimmed);

            if (Number.isNaN(amount)) return 0;

            return trimmed.endsWith('ms') ? amount : amount * 1000;
          })
          .reduce((a, b) => Math.max(a, b), 0);

      return [...document.querySelectorAll('body *')]
        .filter((node) => {
          const style = getComputedStyle(node);

          return (
            longest(style.animationDuration) > threshold ||
            longest(style.transitionDuration) > threshold
          );
        })
        .slice(0, 10)
        .map((node) => {
          const style = getComputedStyle(node);

          return (
            `${node.tagName.toLowerCase()}.${node.className.toString().split(/\s+/)[0] ?? ''} ` +
            `(animation ${style.animationDuration}, transition ${style.transitionDuration})`
          );
        });
    }, PERCEPTIBLE_MS);

    expect(moving, `Still moving under prefers-reduced-motion:\n${moving.join('\n')}`).toEqual([]);
  });

  test('an infinite animation is collapsed to a single iteration', async ({ page }) => {
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    // Duration alone is not enough for `animate-pulse`, which is `infinite`. A 0.01ms animation
    // repeating forever is still a repaint loop, so the iteration count has to be clamped too.
    const pulsing = page.locator('.animate-pulse').first();

    await expect(pulsing).toBeVisible();
    expect(await pulsing.evaluate((node) => getComputedStyle(node).animationIterationCount)).toBe(
      '1',
    );
  });

  test('the loading skeleton is suppressed but still visible', async ({ page }) => {
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    // Suppressed, not hidden. Removing the placeholder would leave a reader with no indication that
    // anything is loading at all, which is a worse outcome than a static grey box.
    const skeleton = page.locator('.animate-pulse').first();

    await expect(skeleton).toBeVisible();
    expect(
      await skeleton.evaluate((node) => Number.parseFloat(getComputedStyle(node).opacity)),
    ).toBeGreaterThan(0);
  });
});

test.describe('forced colours', () => {
  test.use({ forcedColors: 'active' });

  /**
   * Windows High Contrast, and the reason every badge and alert carries a border.
   *
   * Forced-colours mode discards background colours and substitutes the user's palette. A control
   * distinguished only by its fill becomes invisible, which is why the tone variants pair a tint with a
   * border rather than relying on the tint alone.
   */
  test('every control keeps a perceivable boundary', async ({ page }) => {
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    const invisible = await page.evaluate(() =>
      [...document.querySelectorAll('button, [role="status"], [role="alert"]')]
        .filter((node) => {
          const style = getComputedStyle(node);
          const width = (value: string): number => Number.parseFloat(value) || 0;

          const bordered =
            width(style.borderTopWidth) > 0 ||
            width(style.borderBottomWidth) > 0 ||
            width(style.outlineWidth) > 0;

          // A control with no border and no text has nothing left once the fill is discarded.
          return !bordered && (node.textContent ?? '').trim() === '';
        })
        .slice(0, 10)
        .map(
          (node) =>
            `${node.tagName.toLowerCase()}.${node.className.toString().split(/\s+/)[0] ?? ''}`,
        ),
    );

    expect(invisible, `No boundary under forced colours:\n${invisible.join('\n')}`).toEqual([]);
  });

  test('still reports no accessibility violations', async ({ page }) => {
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    await expectNoViolations(page);
  });
});

test.describe('fonts', () => {
  /**
   * The deferred check from WP-03.2, now that a browser is available.
   *
   * The unit test there could only assert that `next/font` was configured with a metric-matched
   * fallback. Whether the fallback actually reaches the computed stack is a browser question, and a
   * missing fallback is invisible until a slow connection swaps the real font in and the whole page
   * shifts.
   */
  test('the computed stack includes a metric-matched fallback', async ({ page }) => {
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    const stack = await page.evaluate(() => getComputedStyle(document.body).fontFamily);

    expect(stack).toMatch(/Source Sans/i);
    // next/font generates a `<name> Fallback` family carrying the size-adjust metrics.
    expect(stack).toMatch(/Fallback/i);
  });

  test('loads no font from a third-party origin', async ({ page }) => {
    // Self-hosting is a privacy commitment as much as a performance one: a request to a font CDN
    // discloses every visitor's IP address and the page they are reading to a third party.
    const external: string[] = [];

    page.on('request', (request) => {
      const url = new URL(request.url());

      if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost')
        external.push(request.url());
    });

    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    expect(external, `Third-party requests:\n${external.join('\n')}`).toEqual([]);
  });
});
