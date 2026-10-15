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
    await expect(page.getByRole('dialog', { name: 'Cart preview' })).toContainText('PKR');
    await expect(page.getByRole('dialog', { name: 'Cart preview' })).not.toContainText('US$');
    await expect(page.getByRole('link', { name: 'Checkout' })).toBeVisible();

    await page.getByRole('link', { name: 'Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    await page.locator('input[name="fullName"]').fill('E2E Buyer');
    await page.locator('input[name="phoneNumber"]').fill('03001234567');
    await page.locator('input[name="streetLine1"]').fill('House 12, Main Road');
    await page.locator('input[name="city"]').fill('Haripur');
    await page.locator('input[name="province"]').fill('Khyber Pakhtunkhwa');
    await page.locator('input[name="postalCode"]').fill('22620');
    await expect(page.locator('input[name="email"]')).toHaveValue('portal-customer@example.com');
    await page.locator('input[name="paymentMethod"][value="cod"]').check();
    await expect(page.locator('input[name="billingSameAsDelivery"]')).toBeChecked();
    await page.locator('input[name="billingSameAsDelivery"]').uncheck();
    await page.locator('input[name="billingPhoneNumber"]').fill('03007654321');
    await page.locator('input[name="billingStreetLine1"]').fill('Office 4, Market Road');
    await page.locator('input[name="billingCity"]').fill('Islamabad');
    await page.locator('input[name="billingProvince"]').fill('Islamabad Capital Territory');
    await page.locator('input[name="billingPostalCode"]').fill('44000');

    const complete = page.waitForRequest(
      (request) => request.url().includes('/api/checkout/complete') && request.method() === 'POST',
    );
    await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
    const submitted = (await complete).postDataJSON();
    expect(submitted.deliveryAddress.city).toBe('Haripur');
    expect(submitted.billingAddress.city).toBe('Islamabad');

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
    await expect(page.getByText('E2E laboratory kit')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('PKR', { exact: false }).first()).toBeVisible();

    const line = page.getByRole('listitem').filter({ hasText: 'E2E laboratory kit' });
    await expect(line.getByText('Quantity 1')).toBeVisible();
    await line.getByRole('button', { name: 'Increase quantity of E2E laboratory kit' }).click();
    await expect(line.getByText('Quantity 2')).toBeVisible();
    await line.getByRole('button', { name: 'Increase quantity of E2E laboratory kit' }).click();
    await expect(line.getByText('Quantity 3')).toBeVisible();
    await line.getByRole('button', { name: 'Decrease quantity of E2E laboratory kit' }).click();
    await expect(line.getByText('Quantity 2')).toBeVisible();
    await line.getByRole('button', { name: 'Decrease quantity of E2E laboratory kit' }).click();
    await expect(line.getByText('Quantity 1')).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'E2E laboratory kit' })).toHaveCount(
      1,
    );

    await page.reload();
    await expect(page.getByText('Quantity 1')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('listitem').filter({ hasText: 'E2E laboratory kit' })).toHaveCount(
      1,
    );

    await page.getByRole('link', { name: 'Proceed to checkout' }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByRole('heading', { name: 'Checkout', level: 1 })).toBeVisible();
  });
});
