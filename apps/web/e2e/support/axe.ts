import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';

import type { Page } from '@playwright/test';
import type { NodeResult, Result } from 'axe-core';

/**
 * The axe harness for the browser-based accessibility gate.
 *
 * The companion to `packages/ui/src/testing/axe.ts`, which runs the same engine in jsdom against
 * individual components. The two are not redundant: jsdom has no layout and no styling, so it cannot
 * evaluate colour contrast, target size, or anything that depends on a box having a position. Those
 * rules only produce an answer here, and they are the ones most likely to be broken by a token change.
 */

/**
 * The tag set from the work package, plus `wcag22aa`.
 *
 * The work package asks for `wcag2a`, `wcag2aa`, and `wcag21aa`. `wcag22aa` is added because the
 * product commits to WCAG 2.2 AA, and 2.2 introduced criteria with automated coverage that the 2.1
 * tags do not select - SC 2.4.11 Focus Not Obscured and SC 2.5.8 Target Size among them. Asking for
 * 2.1 while claiming 2.2 would leave exactly the new criteria unchecked.
 *
 * `best-practice` is deliberately excluded. It contains opinions rather than conformance
 * requirements, and mixing them in means a failing run no longer tells you whether the product is
 * non-conformant or merely unfashionable.
 */
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const;

/**
 * Formats violations into something actionable.
 *
 * Playwright prints a bare `expected [] to have length 0` otherwise, and the detail is in the object
 * it just elided. A person reading a CI log needs the rule, the reason, and the element - without the
 * selector the next step is to guess which of several hundred nodes is at fault.
 */
export function formatViolations(violations: readonly Result[]): string {
  if (violations.length === 0) return 'No accessibility violations.';

  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map(
          (node: NodeResult) =>
            `      ${node.target.join(' ')}\n        ${node.failureSummary ?? ''}`,
        )
        .join('\n');

      return `  [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}\n${nodes}`;
    })
    .join('\n\n');
}

export interface ScanOptions {
  /**
   * Restricts the scan to a subtree.
   *
   * Used to scope a scan to one component's example on the preview page, so a violation reported for
   * a shared page chrome is not attributed to the component under test.
   */
  readonly include?: string;
  /**
   * Rules to disable, each with a reason.
   *
   * A `string[]` would let a rule be switched off in passing. Requiring the reason in the same
   * expression makes the cost visible at the call site and leaves the justification next to the
   * exclusion rather than in a commit message nobody will find.
   */
  readonly disable?: Readonly<Record<string, string>>;
}

/** Runs axe and returns the violations, leaving the assertion to the caller. */
export async function scan(page: Page, options: ScanOptions = {}): Promise<readonly Result[]> {
  let builder = new AxeBuilder({ page }).withTags([...WCAG_TAGS]);

  if (options.include !== undefined) builder = builder.include(options.include);

  const disabled = Object.keys(options.disable ?? {});
  if (disabled.length > 0) builder = builder.disableRules(disabled);

  const { violations } = await builder.analyze();

  return violations;
}

/** Runs axe and asserts zero violations, with the detail in the failure message. */
export async function expectNoViolations(page: Page, options: ScanOptions = {}): Promise<void> {
  const violations = await scan(page, options);

  expect(violations, formatViolations(violations)).toEqual([]);
}
