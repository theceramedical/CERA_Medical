import { expect, test } from '@playwright/test';

test.describe('authentication entry points', () => {
  test('customer sign-in and registration redirect to public contact', async ({ page }) => {
    await page.goto('/auth/sign-in?next=/account');
    await expect(page).toHaveURL(/\/contact$/);

    await page.goto('/auth/sign-up');
    await expect(page).toHaveURL(/\/contact$/);
  });

  test('staff sign-in helper points to the local protected staff route', async ({ request }) => {
    const response = await request.get('/auth/signin?next=/staff/orders', { maxRedirects: 0 });
    expect(response.status()).toBe(302);
    expect(response.headers().location).toBe('http://localhost:3100/staff/orders');
  });
});
