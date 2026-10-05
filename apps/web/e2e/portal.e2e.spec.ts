import { expect, test, type Page } from '@playwright/test';

/** `__Host-` session cookies must be set by the app; Playwright cannot add them directly. */
async function setPortalSession(page: Page, variant: 'verified' | 'unverified'): Promise<void> {
  await page.goto(`/dev/e2e/session?variant=${variant}`);
  await expect(page.getByRole('heading', { name: 'Your account', level: 1 })).toBeVisible();
}

test.describe('customer portal', () => {
  test('sign-in page starts OIDC with a full navigation control', async ({ page }) => {
    await page.goto('/auth/sign-in?next=/account');
    await expect(page.getByTestId('oidc-sign-in-continue')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue to secure sign in' })).toBeVisible();
  });

  test('verified customer can open dashboard, profile, enquiries, and orders', async ({ page }) => {
    await setPortalSession(page, 'verified');

    await page.goto('/account');
    await expect(page.getByRole('heading', { name: 'Your account', level: 1 })).toBeVisible();
    await expect(page.getByText('portal-customer@example.com')).toBeVisible();

    await page.getByRole('link', { name: 'View your enquiries' }).click();
    await expect(page).toHaveURL(/\/account\/enquiries$/);
    await expect(page.getByRole('heading', { name: 'Your enquiries', level: 1 })).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'No enquiries in your account yet', level: 2 }),
    ).toBeVisible();

    await page.goto('/account/profile');
    await expect(page.getByRole('heading', { name: 'Your profile', level: 1 })).toBeVisible();
    await expect(page.locator('input[name="displayName"]')).toHaveValue('Portal Customer');

    await page.goto('/account/orders');
    await expect(page.getByRole('heading', { name: 'Your orders', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'No orders yet', level: 2 })).toBeVisible();

    await page.goto('/account/claim');
    await expect(page.getByRole('heading', { name: 'Claim an enquiry', level: 1 })).toBeVisible();
  });

  test('unverified email cannot open enquiries (guided error, not a crash)', async ({ page }) => {
    await setPortalSession(page, 'unverified');

    await page.goto('/account');
    await expect(page.getByText('Verify your email to use enquiries and orders')).toBeVisible();

    await page.goto('/account/enquiries');
    await expect(page).toHaveURL(/\/auth\/error\?reason=email_unverified/);
    await expect(
      page.getByRole('heading', { name: 'Verify your email to use the portal', level: 1 }),
    ).toBeVisible();

    await page.goto('/account/profile');
    await expect(page.getByRole('heading', { name: 'Your profile', level: 1 })).toBeVisible();
  });
});
