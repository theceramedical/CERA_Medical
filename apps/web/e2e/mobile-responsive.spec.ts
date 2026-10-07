import { expect, test } from '@playwright/test';

import { PUBLIC_ROUTES } from './support/routes.ts';

import type { Page } from '@playwright/test';

const MOBILE_VIEWPORT_WIDTH = 390;

/** True when the document is wider than the viewport (horizontal scroll). */
async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
}

test.describe('mobile layout', () => {
  for (const route of [...PUBLIC_ROUTES, '/products']) {
    test(`${route} has no horizontal overflow`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }

  test('home cart control does not leave a preview panel open on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('dialog', { name: 'Cart preview' })).toHaveCount(0);
  });

  test('mobile cart icon navigates to cart instead of opening an overlay', async ({ page }) => {
    await page.goto('/');
    const cart = page.getByRole('link', { name: /cart/i });
    await expect(cart).toBeVisible();
    await cart.click();
    await expect(page).toHaveURL(/\/cart$/);
    await expect(page.getByRole('dialog', { name: 'Cart preview' })).toHaveCount(0);
  });

  test('mobile menu panel spans the viewport width', async ({ page }) => {
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Open menu' });
    const panelId = await trigger.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    await trigger.click();
    const panel = page.locator(`#${panelId ?? ''}`);
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    if (box !== null) {
      expect(box.width).toBeGreaterThan(MOBILE_VIEWPORT_WIDTH - 4);
    }
  });
});
