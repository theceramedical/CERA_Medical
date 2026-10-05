import { expect, test } from '@playwright/test';

/**
 * Manual portal checklist — run with Playwright UI or headed live config.
 *
 *   pnpm stack:up && pnpm dev
 *   pnpm test:live:ui
 *
 * In Playwright UI: pick a test, click Run, complete Authentik when the browser opens.
 * Tests call `page.pause()` so you can step through account pages before asserting.
 */
test.describe.configure({ mode: 'serial' });

test.describe('portal manual checklist @live', () => {
  test('sign in and reach account dashboard', async ({ page }) => {
    await page.goto('/auth/sign-in?next=/account');
    await expect(page.getByRole('heading', { name: 'Sign in', level: 1 })).toBeVisible();
    await expect(page.getByTestId('oidc-sign-in-continue')).toBeVisible();

    await page.pause();

    await expect(page.getByRole('heading', { name: 'Your account', level: 1 })).toBeVisible({
      timeout: 120_000,
    });
  });

  test('open profile, enquiries, and claim', async ({ page }) => {
    await page.goto('/account');
    await page.pause();

    await page.getByRole('link', { name: 'Update your profile' }).click();
    await expect(page.getByRole('heading', { name: 'Your profile', level: 1 })).toBeVisible();
    await page.pause();

    await page.getByRole('link', { name: 'View your enquiries' }).click();
    await expect(page.getByRole('heading', { name: 'Your enquiries', level: 1 })).toBeVisible();
    await expect(page.getByText('Something went wrong')).not.toBeVisible();
    await page.pause();

    await page.goto('/account/claim');
    await expect(page.getByRole('heading', { name: 'Claim an enquiry', level: 1 })).toBeVisible();
    await page.pause();
  });

  test('sign out', async ({ page }) => {
    await page.goto('/account');
    await page.pause();

    await page.getByRole('link', { name: 'Sign out' }).click();
    await page.pause();

    await page.goto('/account/enquiries');
    await expect(page).toHaveURL(/\/auth\/sign-in/);
  });
});
