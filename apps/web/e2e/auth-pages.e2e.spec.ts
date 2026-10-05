import { expect, test } from '@playwright/test';

test.describe('auth pages', () => {
  test('sign-in shows email and configured social options', async ({ page }) => {
    await page.goto('/auth/sign-in?next=/account');
    await expect(page.getByRole('heading', { name: 'Sign in', level: 1 })).toBeVisible();
    await expect(page.getByTestId('oidc-sign-in-continue')).toBeVisible();
    await expect(page.getByTestId('oidc-sign-in-google')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create an account' })).toBeVisible();
  });

  test('sign-up mirrors registration copy and providers', async ({ page }) => {
    await page.goto('/auth/sign-up?next=/account');
    await expect(page.getByRole('heading', { name: 'Create account', level: 1 })).toBeVisible();
    await expect(page.getByTestId('oidc-sign-in-google')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in instead' })).toBeVisible();
  });
});
