import { expect, test } from '@playwright/test';

test.describe('auth pages', () => {
  test('sign-in shows email and configured social options', async ({ page }) => {
    await page.goto('/auth/sign-in?next=/account');
    await expect(page.getByRole('heading', { name: 'Your account', level: 1 })).toBeVisible();
    await expect(page.getByTestId('oidc-sign-in-continue')).toBeVisible();
    await expect(page.getByTestId('oidc-sign-in-google')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Create an account' })).toBeVisible();
  });

  test('staff sign-in never advertises customer enrollment or Google', async ({ page }) => {
    await page.goto('/auth/sign-in?next=/staff');
    await expect(page.getByRole('heading', { name: 'Staff sign in', level: 1 })).toBeVisible();
    await expect(page.getByTestId('oidc-sign-in-continue')).toBeVisible();
    await expect(page.getByTestId('oidc-sign-in-google')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Create an account' })).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Go to customer sign in' })).toBeVisible();
  });

  test('sign-up mirrors registration copy and providers', async ({ page }) => {
    await page.goto('/auth/sign-up?next=/account');
    await expect(page.getByRole('heading', { name: 'Create account', level: 1 })).toBeVisible();
    await expect(page.getByTestId('oidc-sign-in-google')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in instead' })).toBeVisible();
  });
});
