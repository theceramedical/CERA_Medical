import axe from 'axe-core';

/**
 * Runs axe over a rendered component and returns its violations.
 *
 * This is the component-level half of the accessibility gate. The page-level half (WP-03.8) runs the
 * same engine through Playwright in a real browser, and the two are not interchangeable:
 *
 *   - jsdom has no layout and no stylesheets, so every rule that needs a computed colour, a box, or
 *     a stacking context is unavailable here. Colour contrast in particular cannot run, which is
 *     why `contrast.test.ts` computes the ratios arithmetically from the tokens instead.
 *   - what jsdom *can* check is the part that lives in the markup: roles, accessible names,
 *     `aria-*` that points at nothing, required parent-child relationships, duplicate ids,
 *     heading order. Those are exactly the mistakes a component makes in isolation, and catching
 *     them here means a failure names the component rather than a page that happens to use it.
 *
 * The rule set is the WCAG 2.2 AA tags, matching the Playwright run, so a component cannot pass one
 * gate and fail the other on the same rule.
 */

const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

/**
 * Rules that cannot produce a meaningful result in jsdom.
 *
 * Disabled explicitly, with a reason each, rather than left to report noise that would train
 * everyone to ignore the output. Anything disabled here is covered by the Playwright run instead.
 */
const UNAVAILABLE_IN_JSDOM = {
  /** Needs computed colours and a paint order, neither of which jsdom provides. */
  'color-contrast': { enabled: false },
  /** Both are page-level: a fragment under test has no landmarks or `<html>` element of its own. */
  region: { enabled: false },
  'html-has-lang': { enabled: false },
  'landmark-one-main': { enabled: false },
  'page-has-heading-one': { enabled: false },
} as const;

export interface AxeResult {
  readonly violations: readonly axe.Result[];
  /** A readable summary, so a failure message names the rule and the element rather than an id. */
  readonly summary: string;
}

export async function checkA11y(container: HTMLElement): Promise<AxeResult> {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: WCAG_AA_TAGS },
    rules: UNAVAILABLE_IN_JSDOM,
  });

  return { violations: results.violations, summary: summarise(results.violations) };
}

function summarise(violations: readonly axe.Result[]): string {
  if (violations.length === 0) return 'no violations';

  return violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');

      return `${violation.id} (${violation.impact ?? 'unknown'}): ${violation.help} [${targets}]`;
    })
    .join('\n');
}
