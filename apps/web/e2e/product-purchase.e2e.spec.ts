import { expect, test } from '@playwright/test';

test.describe('product purchase actions', () => {
  test('adds the selected quantity from product detail and shows the persisted cart', async ({
    page,
  }) => {
    await page.goto('/products/E2E-PRODUCT-001');

    await expect(page.getByRole('heading', { name: 'E2E laboratory kit', level: 1 })).toBeVisible();
    await page.getByRole('spinbutton', { name: 'Quantity for E2E-PRODUCT-001' }).fill('3');
    await page.getByRole('button', { name: 'Add to cart' }).click();

    await expect(page.getByRole('status')).toHaveText('Added to cart.');
    await page.goto('/cart');
    const line = page.getByRole('listitem').filter({ hasText: 'E2E laboratory kit' });
    await expect(line).toBeVisible();
    await expect(line.getByText('Quantity 3')).toBeVisible();
  });

  test('keeps enquiry available and hides cart controls for a disabled product', async ({
    page,
  }) => {
    await page.goto('/products/CR-MOL-1021');

    await expect(page.getByRole('link', { name: 'Enquire / Order Product' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to cart' })).toHaveCount(0);
    await expect(page.getByRole('spinbutton')).toHaveCount(0);
  });

  test('shows an error and no success state when adding to cart fails', async ({ page }) => {
    await page.route('**/v1/cart/lines', async (route) => {
      await route.fulfill({ status: 500, body: 'Cart unavailable' });
    });
    await page.goto('/products/E2E-PRODUCT-001');
    await page.getByRole('button', { name: 'Add to cart' }).click();

    await expect(
      page.getByText('Cart could not be saved. Please try again.', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Added to cart' })).toHaveCount(0);
  });
});
