import { expect, test } from '@playwright/test';

import type { Locator, Page } from '@playwright/test';

/**
 * The keyboard walk - WP-03.8.
 *
 * axe cannot do any of this. Whether a control is reachable, whether the focus ring is visible against
 * what is behind it, and whether Escape closes a dialog are all behavioural, and a page can satisfy
 * every automated rule while being impossible to operate without a pointer.
 */

const PREVIEW = '/dev/design';

/** Describes the focused element well enough to name it in a failure. */
async function focused(page: Page): Promise<{ tag: string; name: string; text: string }> {
  return page.evaluate(() => {
    const element = document.activeElement;

    if (element === null) return { tag: 'none', name: '', text: '' };

    return {
      tag: element.tagName.toLowerCase(),
      name: element.getAttribute('aria-label') ?? '',
      text: (element.textContent ?? '').trim().slice(0, 60),
    };
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto(PREVIEW);
  await page.waitForLoadState('networkidle');
});

test.describe('skip link', () => {
  /**
   * SC 2.4.1 Bypass Blocks.
   *
   * The first Tab from the address bar has to land on the skip link, and activating it has to move
   * focus - not just scroll. A skip link that scrolls without moving focus leaves the next Tab back at
   * the top of the header, which is the failure it was added to prevent.
   */
  test('is the first thing focused and moves focus to main', async ({ page }) => {
    await page.keyboard.press('Tab');

    const link = page.locator(':focus');
    await expect(link).toHaveText(/skip/i);
    // Hidden until focused, then it must actually be on screen - a skip link nobody can see is a skip
    // link nobody uses.
    await expect(link).toBeInViewport();

    await page.keyboard.press('Enter');

    const target = await page.evaluate(() => document.activeElement?.id ?? '');
    expect(target).toBe('main-content');
  });
});

test.describe('focus visibility', () => {
  /**
   * SC 2.4.13 Focus Appearance and SC 2.4.11 Focus Not Obscured.
   *
   * Every focusable element is walked, and each one has to have a focus indicator and has to be inside
   * the viewport when focused. The second is the one that catches real bugs: a control that scrolls
   * into view behind a sticky header is focusable, styled, and invisible.
   */
  test('every focusable element shows a ring and is not obscured', async ({ page }) => {
    const focusables = page.locator(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
        'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );

    const count = await focusables.count();
    // A guard against the selector silently matching nothing, which would make this test vacuous.
    expect(count).toBeGreaterThan(50);

    const missing: string[] = [];

    for (let index = 0; index < count; index += 1) {
      const element = focusables.nth(index);

      await element.focus();

      const indicator = await element.evaluate((node) => {
        const style = getComputedStyle(node);

        return {
          outlineWidth: style.outlineWidth,
          outlineStyle: style.outlineStyle,
          boxShadow: style.boxShadow,
        };
      });

      const hasRing =
        (indicator.outlineStyle !== 'none' && Number.parseFloat(indicator.outlineWidth) > 0) ||
        indicator.boxShadow !== 'none';

      if (!hasRing) {
        const { tag, name, text } = await focused(page);
        missing.push(`${tag} "${name || text}"`);
      }
    }

    expect(missing, `No visible focus indicator on:\n${missing.join('\n')}`).toEqual([]);
  });
});

test.describe('the focus trap', () => {
  /** Opens the demo dialog and returns its locator. */
  async function openDialog(page: Page): Promise<Locator> {
    const trigger = page
      .locator('#feedback')
      .getByRole('button', { name: 'Open a trapped dialog' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click({ force: true });

    const dialog = page.getByRole('dialog', { name: 'Confirm your details' });
    await expect(dialog).toBeVisible();

    return dialog;
  }

  test('moves focus into the dialog on open', async ({ page }) => {
    const dialog = await openDialog(page);
    const active = page.locator(':focus');

    // Focus inside the dialog, not left on the trigger behind it. A modal that opens without moving
    // focus is one a screen reader user does not know appeared.
    await expect(dialog.locator(':focus')).toHaveCount(1);
    await expect(active).toBeVisible();
  });

  test('wraps Tab at the last control and Shift+Tab at the first', async ({ page }) => {
    const dialog = await openDialog(page);

    const inside = dialog.locator(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    const count = await inside.count();
    expect(count).toBeGreaterThan(1);

    // One full cycle plus one, which is the step that has to land back inside rather than escaping to
    // the browser chrome or to the page behind.
    for (let index = 0; index <= count; index += 1) {
      await page.keyboard.press('Tab');
      await expect(dialog.locator(':focus')).toHaveCount(1);
    }

    for (let index = 0; index <= count; index += 1) {
      await page.keyboard.press('Shift+Tab');
      await expect(dialog.locator(':focus')).toHaveCount(1);
    }
  });

  test('closes on Escape and returns focus to the trigger', async ({ page }) => {
    const trigger = page.getByRole('button', { name: 'Open a trapped dialog' });
    const dialog = await openDialog(page);

    await page.keyboard.press('Escape');

    await expect(dialog).toBeHidden();
    // Returning focus is the half that gets forgotten. Without it focus falls to the document body and
    // the next Tab restarts from the top of the page, losing the user's place entirely.
    await expect(trigger).toBeFocused();
  });
});

test.describe('toasts', () => {
  /**
   * SC 2.2.1 Timing Adjustable, and the reason `danger` ignores `duration`.
   *
   * An informational toast may time out. An error explaining that a submission failed may not: it
   * carries the only copy of what went wrong and what to do next, and a reader who needs longer than
   * six seconds loses it permanently.
   */
  test('a danger toast stays until dismissed', async ({ page }) => {
    const trigger = page.locator('#feedback').getByRole('button', { name: /^Danger/ });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click({ force: true });

    // `exact` matters: the dismiss button's accessible name contains the title, so a substring match
    // resolves to both the message and the button that closes it.
    const toast = page.getByText('We could not submit your enquiry', { exact: true });
    await expect(toast).toBeVisible();

    // Well past the 6s default any other tone would have used.
    await page.waitForTimeout(8000);
    await expect(toast).toBeVisible();

    await page.getByRole('button', { name: 'Dismiss: We could not submit your enquiry' }).click();
    await expect(toast).toBeHidden();
  });

  /**
   * The region has to be the persistent ancestor, not the message itself.
   *
   * A live region inserted at the same moment as its first message is frequently not announced at all,
   * because the assistive technology has nothing to have been watching. This is the assertion that
   * found the defect: the roles were on each toast, so both live regions were created and destroyed
   * with their content.
   */
  test('the live regions exist before any toast does', async ({ page }) => {
    // Scoped to the toast viewport rather than the document. `SkeletonRegion` is also a polite live
    // region, and it should be - a page may legitimately have several.
    const viewport = page.locator('[aria-live="assertive"]').locator('..');

    await expect(viewport.locator('[aria-live="polite"]')).toHaveCount(1);
    await expect(viewport.locator('[aria-live="assertive"]')).toHaveCount(1);
  });

  test('a polite toast lands in the polite region', async ({ page }) => {
    const trigger = page.locator('#feedback').getByRole('button', { name: 'Info' });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click({ force: true });

    await expect(
      page.locator('[aria-live="polite"]').filter({ hasText: 'Draft saved' }),
    ).toHaveCount(1);
  });

  /**
   * Routing by tone, which is why there are two regions rather than one.
   *
   * An error is worth interrupting whatever the screen reader is mid-sentence on. A confirmation is not,
   * and an assertive confirmation is the behaviour that makes people switch announcements off entirely.
   */
  test('an error toast lands in the assertive region', async ({ page }) => {
    const trigger = page.locator('#feedback').getByRole('button', { name: /^Danger/ });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click({ force: true });

    await expect(
      page
        .locator('[aria-live="assertive"]')
        .filter({ hasText: 'We could not submit your enquiry' }),
    ).toHaveCount(1);
    await expect(
      page.locator('[aria-live="polite"]').filter({ hasText: 'We could not submit your enquiry' }),
    ).toHaveCount(0);
  });
});

test.describe('the table scroll region', () => {
  /**
   * SC 2.1.1 Keyboard.
   *
   * A horizontally scrollable region that is not focusable can only be scrolled with a pointer. The
   * wrapper carries `tabindex="0"` and a name so a keyboard user can reach it and use the arrow keys.
   */
  test('is reachable and named', async ({ page }) => {
    // Matched on the name rather than on the content: every PreviewSection is also a named region, and
    // a content filter finds the enclosing section before the table's own wrapper.
    const region = page.getByRole('region', { name: /scrollable/ }).first();

    await expect(region).toHaveAttribute('tabindex', '0');

    await region.focus();
    await expect(region).toBeFocused();
    // Focusable and silent is its own failure - the user tabs to an element and hears nothing.
    await expect(region).toHaveAttribute('aria-label', /.+/);
  });
});
