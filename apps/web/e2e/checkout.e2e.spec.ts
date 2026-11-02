import { expect, test } from '@playwright/test';

/**
 * Guest COD checkout UI against the E2E catalogue/cart stub (Vendure and D1 are not started in CI).
 * Covers cart cookie → cart page → guest COD checkout → confirmation verification UI.
 */
test.describe('physical product checkout', () => {
  test('completes guest COD checkout from the persisted cart', async ({ page }) => {
    await page.goto('/cart');
    const seededCartStatus = await page.evaluate(async () => {
      const response = await fetch('/v1/cart/lines', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'E2E-PRODUCT-001', quantity: 1 }),
      });
      return response.status;
    });
    expect(seededCartStatus).toBe(200);
    await page.reload();

    await expect(page.getByText('E2E laboratory kit')).toBeVisible();
    await expect(page.getByText('PKR', { exact: false }).first()).toBeVisible();
    await page.getByRole('link', { name: 'Proceed to checkout' }).click();
    await expect(page).toHaveURL(/\/checkout$/);

    await page.locator('input[name="fullName"]').fill('E2E Buyer');
    await page.locator('input[name="email"]').fill('buyer@example.com');
    await page.locator('input[name="phoneNumber"]').fill('03001234567');
    await page.locator('input[name="streetLine1"]').fill('House 12, Main Road');
    await page.locator('input[name="city"]').fill('Haripur');
    await page.locator('input[name="province"]').fill('Khyber Pakhtunkhwa');
    await page.locator('input[name="postalCode"]').fill('22620');
    await page.locator('input[name="paymentMethod"][value="cod"]').check();
    await page.route('**/api/checkout/complete', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orderCode: 'E2E-CHECKOUT-0001' }),
      });
    });
    await page.route('**/api/checkout/confirmation**', async (route) => {
      const requestUrl = new URL(route.request().url());
      const orderCode = requestUrl.searchParams.get('order');
      if (orderCode !== 'E2E-CHECKOUT-0001') {
        await route.fulfill({ status: 404, body: 'not found' });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orderCode }),
      });
    });
    const complete = page.waitForRequest(
      (request) => request.url().includes('/api/checkout/complete') && request.method() === 'POST',
    );
    await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
    const submitted = (await complete).postDataJSON();
    expect(submitted.fullName).toBe('E2E Buyer');
    expect(submitted.email).toBe('buyer@example.com');
    expect(submitted.paymentMethod).toBe('cod');
    expect(submitted.deliveryAddress.city).toBe('Haripur');
    expect(submitted.billingAddress).toBeUndefined();

    await expect(page).toHaveURL(/\/checkout\/confirmation\?order=/);
    await expect(page.getByRole('heading', { name: 'Thank you', level: 1 })).toBeVisible();
    await expect(page.getByText(/E2E-CHECKOUT-/)).toBeVisible();
    await expect(page.getByText(/No email confirmation has been sent\./)).toBeVisible();
  });

  test('does not show success when the order cannot be verified', async ({ page }) => {
    await page.route('**/api/checkout/confirmation**', async (route) => {
      await route.fulfill({ status: 404, body: 'not found' });
    });

    await page.goto('/checkout/confirmation?order=NOT-PERSISTED');

    await expect(page.getByRole('heading', { name: 'Order not verified', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thank you', level: 1 })).toHaveCount(0);
  });

  test('full cart page loads lines after client refresh', async ({ page }) => {
    await page.goto('/cart');
    const seededCartStatus = await page.evaluate(async () => {
      const response = await fetch('/v1/cart/lines', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: 'E2E-PRODUCT-001', quantity: 1 }),
      });
      return response.status;
    });
    expect(seededCartStatus).toBe(200);
    await page.reload();
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
