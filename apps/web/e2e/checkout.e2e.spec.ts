import { expect, test } from '@playwright/test';

/**
 * Physical product checkout against the E2E API stub (Vendure is not started in CI).
 * Covers catalogue UI → cart cookie → mini cart → COD checkout → confirmation.
 */
test.describe('physical product checkout', () => {
  test('adds a SKU from the catalogue and completes COD checkout', async ({ page }) => {
    await page.goto('/dev/e2e/session?variant=verified');
    await page.goto('/products');
    await page.locator('#catalog-grid').scrollIntoViewIfNeeded();

    const addLine = page.waitForResponse(
      (response) =>
        response.url().includes('/v1/cart/lines') && response.request().method() === 'POST',
    );
    await page
      .locator('#catalog-grid')
      .getByRole('button', { name: 'Add to cart', exact: true })
      .first()
      .click();
    expect((await addLine).ok()).toBe(true);

    await expect(page.getByRole('button', { name: /Cart/ })).toBeVisible();
    await page.getByRole('button', { name: /Cart/ }).click();
    await expect(page.getByRole('dialog', { name: 'Cart preview' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Checkout' })).toBeVisible();

    await page.getByRole('link', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    await page.locator('input[name="fullName"]').fill('E2E Buyer');
    await expect(page.locator('input[name="email"]')).toHaveValue('portal-customer@example.com');
    await page.locator('input[name="paymentMethod"][value="cod"]').check();

    await page.getByRole('button', { name: 'Confirm order', exact: true }).click();

    await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/);
    await expect(page.getByRole('heading', { name: 'Thank you', level: 1 })).toBeVisible();
    await expect(page.getByText(/E2E-CHECKOUT-/)).toBeVisible();
  });

  test('full cart page loads lines after client refresh', async ({ page }) => {
    await page.goto('/dev/e2e/session?variant=verified');
    await page.goto('/products');
    await page.locator('#catalog-grid').scrollIntoViewIfNeeded();

    const addLine = page.waitForResponse(
      (response) =>
        response.url().includes('/v1/cart/lines') && response.request().method() === 'POST',
    );
    await page
      .locator('#catalog-grid')
      .getByRole('button', { name: 'Add to cart', exact: true })
      .first()
      .click();
    expect((await addLine).ok()).toBe(true);

    await page.goto('/cart');
    await expect(page.getByRole('heading', { name: 'Your cart', level: 1 })).toBeVisible();
    await expect(page.getByText('CERA-GLIO-01')).toBeVisible({ timeout: 15_000 });

    await page.getByRole('link', { name: 'Proceed to checkout' }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole('heading', { name: 'Checkout', level: 1 })).toBeVisible();
  });
});
