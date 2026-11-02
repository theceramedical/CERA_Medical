import { expect, test } from '@playwright/test';

test.describe('retired customer account routes', () => {
  test('customer sign-in and registration route to public contact', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole('heading', { name: 'Contact', level: 1 })).toBeVisible();

    await page.goto('/auth/sign-up');
    await expect(page).toHaveURL(/\/contact$/);
  });

  test('account bookmarks route to contact even if an old session cookie exists', async ({
    page,
  }) => {
    await page.route('**/account/orders', async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          cookie: '__Host-cera_session=retired-customer-session',
        },
      });
    });
    await page.goto('/account/orders');
    await expect(page).toHaveURL(/\/contact$/);
    await expect(page.getByRole('heading', { name: 'Contact', level: 1 })).toBeVisible();
  });
});
