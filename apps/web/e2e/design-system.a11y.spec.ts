import { expect, test } from '@playwright/test';

import { expectNoViolations, formatViolations, scan, WCAG_TAGS } from './support/axe.ts';

/**
 * The accessibility baseline for the design system - WP-03.8, PRD QA-1102.
 *
 * Run against `/dev/design` rather than a real page, and that is the point of the route. On a composed
 * page a violation could be the component or the composition, and any component with no instance on a
 * built page is not covered at all. Here every component and every state has exactly one instance, so
 * a passing run is a statement about the library.
 *
 * What this suite does not cover, deliberately: a screen reader actually reading the page, and
 * slow-network behaviour. Both are manual and both are deferred to Phase 14, where full pages exist.
 * axe finds missing and malformed semantics; it cannot tell you that the semantics are misleading.
 */

const PREVIEW = '/dev/design';

test.describe('axe', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PREVIEW);
    // The page is server-rendered, but the client island hydrates and the fonts swap in. Contrast and
    // target-size rules read computed styles, so scanning before that settles measures the fallback.
    await page.waitForLoadState('networkidle');
  });

  test('reports no violations across the whole library', async ({ page }) => {
    await expectNoViolations(page);
  });

  /**
   * A negative control.
   *
   * Without it, "zero violations" and "the engine never ran" are the same result, and the second is
   * the more likely of the two to go unnoticed for months. A button with no accessible name is
   * injected, the same scan is run, and `button-name` must appear. This is the one test in the suite
   * whose failure means the gate itself is broken rather than the product.
   */
  test('the scan actually fails when something is wrong', async ({ page }) => {
    await page.evaluate(() => {
      const broken = document.createElement('button');
      broken.id = 'axe-negative-control';
      document.body.append(broken);
    });

    const violations = await scan(page);

    expect(
      violations.map(({ id }) => id),
      `The negative control was not detected, so the axe run proves nothing. ` +
        `Tags in use: ${WCAG_TAGS.join(', ')}. Reported: ${formatViolations(violations)}`,
    ).toContain('button-name');
  });

  /**
   * Per-section scans, so a failure names the component rather than the page.
   *
   * The whole-page scan above is the gate. These exist because "the design system has a violation" is
   * a much worse starting point for a fix than "the table has one", and axe's own selector output is
   * not always enough to place a node in a page of sixty examples.
   */
  const SECTIONS = [
    'colour',
    'contrast',
    'type',
    'scales',
    'actions',
    'forms',
    'feedback',
    'surfaces',
    'navigation',
    'data',
    'composites',
    'process',
    'section-headers',
    'status',
    'brand',
  ] as const;

  for (const section of SECTIONS) {
    test(`reports no violations in the ${section} section`, async ({ page }) => {
      await expectNoViolations(page, { include: `#${section}` });
    });
  }
});

/**
 * Colour contrast, checked in the browser rather than only from the tokens.
 *
 * `packages/ui` proves the ratios arithmetically from `theme.css`, which is the stronger check for the
 * pairings it knows about. What it cannot see is a component that pairs two tokens nobody listed - a
 * `text-muted` accidentally placed on `bg-primary`, say. axe reads the computed styles of every node,
 * so it catches the pairing that was never written down.
 */
test.describe('colour contrast', () => {
  test('every rendered text node meets its threshold', async ({ page }) => {
    await page.goto(PREVIEW);
    await page.waitForLoadState('networkidle');

    const violations = await scan(page);
    const contrast = violations.filter(({ id }) => id.startsWith('color-contrast'));

    expect(contrast, formatViolations(contrast)).toEqual([]);
  });
});
