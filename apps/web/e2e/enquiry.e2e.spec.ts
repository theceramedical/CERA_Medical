import { expect, test } from '@playwright/test';

test.describe('enquiry form', () => {
  test('a keyboard-only user can submit and read the reference', async ({ page }) => {
    await page.goto('/enquiry');

    await page.locator('input[name="name"]').fill('Alex Patient');
    await page.locator('#main input[name="email"]').fill('alex@example.com');
    await page.locator('select[name="serviceId"]').selectOption('research-collaboration');
    await page
      .locator('textarea[name="message"]')
      .fill('I would like to know about a first appointment.');
    await page.locator('input[name="consent"]').check();

    // The 2s anti-automation gate is wall-clock; wait it out before submit.
    await page.waitForTimeout(2100);
    await page.getByRole('button', { name: 'Submit enquiry', exact: true }).focus();
    await page.keyboard.press('Enter');

    const reference = page.getByTestId('enquiry-reference');
    await expect(reference).toBeVisible();
    await expect(reference).toHaveText(/CERA-\d{6}-[0-9A-Z]+/);
  });

  test('a validation failure preserves safe fields and focuses the summary', async ({ page }) => {
    await page.goto('/enquiry');

    await page.locator('input[name="name"]').fill('Alex Patient');
    await page.locator('#main input[name="email"]').fill('not-an-email');
    await page.locator('select[name="serviceId"]').selectOption('research-collaboration');
    await page
      .locator('textarea[name="message"]')
      .fill('I would like to know about a first appointment.');
    await page.locator('input[name="consent"]').check();
    await page.waitForTimeout(2100);
    await page.getByRole('button', { name: 'Submit enquiry', exact: true }).click();

    const summary = page.getByRole('alert').first();
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await expect(page.locator('input[name="name"]')).toHaveValue('Alex Patient');
    await expect(page.locator('input[name="consent"]')).toBeChecked();
  });

  test('submits with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/enquiry');
    await page.locator('input[name="name"]').fill('Alex Patient');
    await page.locator('#main input[name="email"]').fill('alex-nojs@example.com');
    await page.locator('select[name="serviceId"]').selectOption('research-collaboration');
    await page
      .locator('textarea[name="message"]')
      .fill('I would like to know about a first appointment.');
    await page.locator('input[name="consent"]').check();
    await page.waitForTimeout(2100);
    await page.getByRole('button', { name: 'Submit enquiry', exact: true }).click();
    await expect(page.getByTestId('enquiry-reference')).toBeVisible();
    await context.close();
  });

  test('requires the selected service-specific consent before accepting an enquiry', async ({
    page,
  }) => {
    await page.goto('/enquiry');
    await page.locator('input[name="name"]').fill('Alex Patient');
    await page.locator('#main input[name="email"]').fill('alex-sequencing@example.com');
    await page.locator('select[name="serviceId"]').selectOption('metagenomic-data-analysis');
    await page
      .locator('textarea[name="message"]')
      .fill('Please help analyse this metagenomic dataset.');
    const specificConsent = page.locator('input[name="sequencingDataConsent"]');
    await expect(specificConsent).toBeVisible();
    await expect(specificConsent).not.toBeChecked();
    await page.locator('input[name="consent"]').check();
    await page.waitForTimeout(2100);
    await page.getByRole('button', { name: 'Submit enquiry', exact: true }).click();
    await expect(page.getByRole('alert').first()).toContainText(
      'service-specific data and materials consent',
    );
    await expect(specificConsent).not.toBeChecked();
  });
});
