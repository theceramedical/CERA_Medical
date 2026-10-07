import { expect, test } from '@playwright/test';

import { PUBLIC_ROUTES } from './support/routes.ts';

import type { Page } from '@playwright/test';

/**
 * Interactive mobile pass — run headed so you can watch clicks:
 *
 *   pnpm test:site:mobile:walkthrough     → https://ceramedical.org (headed)
 *   pnpm test:mobile:walkthrough          → localhost (headed, builds app)
 *
 * Captures full-page screenshots under `test-results/mobile-walkthrough/` and fails if any route
 * overflows horizontally after scroll.
 */

const ROUTES = [...PUBLIC_ROUTES, '/products'] as const;

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
}

async function scrollFullPage(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight, 320);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    }
    window.scrollTo(0, 0);
  });
}

function screenshotName(route: string): string {
  const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '-');
  return slug;
}

test.describe.configure({ mode: 'serial' });

test.describe('mobile click-through', () => {
  test('tap through shell and every public route @headed', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    const issues: string[] = [];
    const shotDir = testInfo.outputDir;

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Home: hamburger → Services → back via logo
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${shotDir}/01-menu-open.png` });
    await page.getByRole('link', { name: 'Services', exact: true }).click();
    await expect(page).toHaveURL(/\/services/);
    await page.waitForTimeout(400);

    await page.locator('a[href="/"]').first().click();
    await expect(page).toHaveURL(/\/(\?.*)?$/);

    // Mobile: link to /cart (after deploy) or legacy header popover — exercise both safely.
    const cartLink = page.getByRole('link', { name: /cart/i });
    const cartButton = page.getByRole('button', { name: /cart/i });
    if (await cartLink.isVisible()) {
      await cartLink.click();
      await expect(page).toHaveURL(/\/cart/);
      await page.waitForTimeout(400);
      await page.locator('a[href="/"]').first().click();
    } else if (await cartButton.isVisible()) {
      await cartButton.click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${shotDir}/02-cart-popover.png` });
      await cartButton.click();
    }

    // Search icon
    await page.getByRole('link', { name: 'Search the site' }).click();
    await expect(page).toHaveURL(/\/search/);
    await page.waitForTimeout(400);

    for (const route of ROUTES) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await scrollFullPage(page);
      await page.waitForTimeout(300);

      if (await hasHorizontalOverflow(page)) {
        issues.push(route);
      }

      await page.screenshot({
        path: `${shotDir}/${screenshotName(route)}.png`,
        fullPage: true,
      });

      // Enquiry: focus first field without submitting
      if (route === '/enquiry') {
        const firstField = page.locator('input, textarea, select').first();
        if (await firstField.isVisible()) {
          await firstField.click();
          await page.waitForTimeout(250);
          await page.screenshot({ path: `${shotDir}/enquiry-field-focus.png` });
        }
      }
    }

    expect(
      issues,
      `Horizontal overflow after scroll on:\n${issues.map((r) => `  - ${r}`).join('\n')}`,
    ).toEqual([]);
  });
});
