import { expect, test } from '@playwright/test';

import { expectNoViolations } from './support/axe.ts';
import { PUBLIC_ROUTES } from './support/routes.ts';

import type { Page } from '@playwright/test';

/**
 * The accessibility gate for assembled pages - Phase 04's exit gate, WEB-301.
 *
 * WP-03.8 covers the design system on `/dev/design`, which is the right place to test a component: one
 * page, every primitive, in isolation. It cannot cover what this file covers. A page is not the sum of
 * its components - a correct `Heading` used at the wrong level produces a broken outline, two correct
 * `nav` elements with no labels produce an ambiguous landmark set, and a valid skip link pointing at a
 * target with no `tabIndex` moves focus nowhere. Every one of those is invisible at the component level
 * and is exactly what a person navigating by landmark or heading hits first.
 */

test.describe('axe over every public route', () => {
  for (const route of PUBLIC_ROUTES) {
    test(route, async ({ page }) => {
      await page.goto(route);
      await expectNoViolations(page);
    });
  }
});

test.describe('heading structure', () => {
  /** Every heading on the page as `[level, text]`, in document order. */
  async function outline(page: Page): Promise<[number, string][]> {
    return page.evaluate(() =>
      [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')].map((heading): [number, string] => [
        Number(heading.tagName.slice(1)),
        heading.textContent?.trim().slice(0, 40) ?? '',
      ]),
    );
  }

  for (const route of PUBLIC_ROUTES) {
    test(`${route} has exactly one h1 and no skipped levels`, async ({ page }) => {
      await page.goto(route);

      const headings = await outline(page);
      const h1s = headings.filter(([level]) => level === 1);

      expect(h1s, `h1s found: ${JSON.stringify(h1s)}`).toHaveLength(1);

      /**
       * A jump from h2 to h4 is not an axe violation - `heading-order` catches some of it, but axe is
       * deliberately lenient about the first heading in a new section - and it is the single most common
       * way a page becomes unnavigable for someone using a heading list. Asserting it directly costs
       * nothing and catches the case where a component was chosen for its size rather than its level.
       */
      const skips = headings
        .map((heading, index): [[number, string], [number, string]] | null => {
          const previous = headings[index - 1];

          return previous !== undefined && heading[0] - previous[0] > 1
            ? [previous, heading]
            : null;
        })
        .filter((pair): pair is [[number, string], [number, string]] => pair !== null);

      expect(
        skips,
        `heading levels skipped on ${route}:\n${skips
          .map(([from, to]) => `  h${String(from[0])} "${from[1]}" -> h${String(to[0])} "${to[1]}"`)
          .join('\n')}\nfull outline: ${JSON.stringify(headings)}`,
      ).toEqual([]);
    });
  }
});

test.describe('landmarks', () => {
  test('the shell exposes exactly one banner, main, and contentinfo', async ({ page }) => {
    await page.goto('/');

    // Duplicated landmarks are what makes "jump to main content" ambiguous, and they are easy to
    // introduce: a second `<main>` inside a route group's layout looks entirely reasonable in isolation.
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
  });

  test('every navigation landmark has a distinct accessible name', async ({ page }) => {
    await page.goto('/');

    const names = await page
      .getByRole('navigation')
      .evaluateAll((nodes) =>
        nodes.map(
          (node) => node.getAttribute('aria-label') ?? node.getAttribute('aria-labelledby'),
        ),
      );

    // Unnamed is the failure the footer's four link columns invite: four `nav` elements announced as
    // "navigation", with no way to tell which is which from a landmark list.
    expect(names.filter((name) => name === null)).toEqual([]);
    expect(new Set(names).size, `navigation names: ${JSON.stringify(names)}`).toBe(names.length);
  });
});

test.describe('the skip link', () => {
  test('is the first focusable element and moves focus into main', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const skip = page.getByRole('link', { name: /skip to (main )?content/i });
    await expect(skip).toBeFocused();

    // Visible on focus, not permanently. SC 2.4.1 is satisfied by a link that can be reached; a link
    // that cannot be *seen* once reached fails SC 2.4.7 instead, which is a common half-fix.
    await expect(skip).toBeVisible();

    await skip.press('Enter');

    /**
     * Focus has to land *on* the target, not merely scroll to it.
     *
     * A fragment link scrolls to an element that cannot hold focus and leaves focus on the link, so the
     * next Tab goes into the header again - the skip link appears to work and skips nothing. `#main`
     * carries `tabIndex={-1}` for this reason, and this is the assertion that proves it.
     */
    await expect(page.locator('#main')).toBeFocused();
  });
});

test.describe('the mobile navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 760 });
    await page.goto('/');
  });

  test('announces its state and traps focus while open', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /menu/i });

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const panel = page.locator(`#${String(await trigger.getAttribute('aria-controls'))}`);
    await expect(panel).toBeVisible();

    /**
     * The trap's boundary is the panel's parent, not the panel.
     *
     * The trigger sits inside the trap container alongside the panel - deliberately, so that a tap on
     * it is not an outside-click, and so that it is first in the cycle where a disclosure's trigger
     * belongs. So the wrap-around lands on the trigger, which is *outside* the panel. Asserting against
     * the panel therefore reports an escape on the ninth Tab press of a trap that is working correctly,
     * which is what the first version of this test did.
     */
    const trap = panel.locator('xpath=..');

    /**
     * A count derived from the trap's own focusable elements plus two, rather than a fixed number: the
     * point is to go past the last control and see whether focus wraps back round or escapes into the
     * page behind, and a hard-coded count stops testing that the moment a nav item is added.
     */
    const focusable = await trap
      .locator('a, button, input, [tabindex]:not([tabindex="-1"])')
      .count();

    for (let press = 0; press < focusable + 2; press += 1) {
      await page.keyboard.press('Tab');
      expect(
        await trap.evaluate((node) => node.contains(document.activeElement)),
        `focus left the trap after ${String(press + 1)} Tab presses`,
      ).toBe(true);
    }
  });

  test('closes on Escape and returns focus to the trigger', async ({ page }) => {
    const trigger = page.getByRole('button', { name: /menu/i });

    await trigger.click();
    await page.keyboard.press('Escape');

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');

    // Returning focus is the part that gets forgotten. Without it a keyboard user who dismisses the menu
    // has focus on a removed element, which browsers reset to `<body>` - so the next Tab restarts the
    // page from the top.
    await expect(trigger).toBeFocused();
  });

  test('locks the background scroll while open and restores it after', async ({ page }) => {
    const overflow = async (): Promise<string> =>
      page.evaluate(() => getComputedStyle(document.body).overflow);

    const before = await overflow();
    const trigger = page.getByRole('button', { name: /menu/i });

    await trigger.click();
    expect(await overflow()).toBe('hidden');

    await page.keyboard.press('Escape');
    // Restored to what it was, not blanked. Blanking works here and breaks the moment something else
    // sets an overflow on `body`.
    expect(await overflow()).toBe(before);
  });

  test('reports no accessibility violations while open', async ({ page }) => {
    await page.getByRole('button', { name: /menu/i }).click();

    // An open disclosure is a different DOM to the one the route sweep above scanned, and it is the one
    // a phone user actually navigates with.
    await expectNoViolations(page);
  });
});

test.describe('error and empty states', () => {
  /**
   * Route states are real pages, not bare strings - the WP-04.2 requirement.
   *
   * `not-found` is reachable by asking for a route that does not exist. `error` and `loading` are not
   * reachable from a browser without provoking a server fault, so their markup is covered by the unit
   * tests in `src/components/route-states.tsx`'s consumers; what this checks is the one a visitor will
   * genuinely hit, which is a mistyped or stale URL.
   */
  test('a missing page renders the shell with a heading and a way forward', async ({ page }) => {
    const response = await page.goto('/this-route-does-not-exist');

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('link', { name: /home/i }).first()).toBeVisible();

    await expectNoViolations(page);
  });
});
