import { expect, test } from '@playwright/test';

import { PUBLIC_ROUTES } from './support/routes.ts';

import type { Page, Response } from '@playwright/test';

/**
 * The Content-Security-Policy, enforced by a real browser - WP-04.6, and the check ADR-010 promises.
 *
 * A nonce CSP has a failure mode that no unit test and no code review catches: the policy is *correct*,
 * the header is present, the response is 200, and nothing works, because the nonce in the header does not
 * match the nonce on the scripts. Chromium then refuses to execute them and the page renders as static
 * HTML - visually almost identical, with a dead mobile menu and a dead newsletter form.
 *
 * That is exactly what happened during Phase 04: the homepage was statically prerendered, so it was built
 * before any request existed and its scripts carried no nonce at all. Eight script tags, zero nonces, no
 * error. ADR-010 records the fix - `export const dynamic = 'force-dynamic'` in the root layout - and this
 * file is the part of that decision that keeps working after everyone has forgotten it. A route that
 * escapes the forcing fails here rather than shipping broken.
 *
 * Deliberately in the `e2e` project rather than `a11y`: a blocked script is a functional fault, and axe
 * would not report it. A page with no JavaScript can be perfectly accessible.
 */

/**
 * The nonce the response's own policy declares, or `null` if the policy has none.
 *
 * Takes `Response | null` because `page.goto` is typed that way - it returns null for a navigation that
 * produced no response, such as a same-document hash change. Narrowing here rather than at each call site
 * keeps the tests reading as assertions.
 */
function nonceFromPolicy(response: Response | null): string | null {
  if (response === null) throw new Error('the navigation produced no response');

  const policy = response.headers()['content-security-policy'];

  expect(policy, 'every response must carry a Content-Security-Policy').toBeDefined();

  return /'nonce-([^']+)'/.exec(policy ?? '')?.[1] ?? null;
}

/**
 * Collects CSP violations the browser reports, for the lifetime of the page.
 *
 * The listener is installed with `addInitScript` so it is in place before the document's own scripts run -
 * a listener attached after `goto` resolves would miss every violation that mattered. `securitypolicyviolation`
 * is the browser's own verdict on the policy, which is the only opinion that counts: it fires whether the
 * cause is a missing nonce, a directive we got wrong, or a third-party script we did not anticipate.
 */
async function collectViolations(page: Page): Promise<string[]> {
  const violations: string[] = [];

  await page.exposeFunction('__ceraReportCspViolation', (detail: string) => {
    violations.push(detail);
  });

  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (event) => {
      void (
        window as unknown as { __ceraReportCspViolation: (detail: string) => Promise<void> }
      ).__ceraReportCspViolation(
        `${event.violatedDirective} blocked ${event.blockedURI || '(inline)'}`,
      );
    });
  });

  return violations;
}

for (const route of PUBLIC_ROUTES) {
  test(`every script on ${route} carries the policy's nonce`, async ({ page }) => {
    const violations = await collectViolations(page);

    const response = await page.goto(route);
    expect(response?.status(), `${route} must be reachable`).toBe(200);

    const nonce = nonceFromPolicy(response);
    expect(nonce, 'the policy must declare a nonce').not.toBeNull();

    /**
     * Read from the DOM rather than the HTML source.
     *
     * Chromium strips the `nonce` *attribute* from the parsed element - deliberately, so that a script
     * which manages to read the DOM cannot steal the value and mint itself a trusted tag - but keeps it
     * on the element's `nonce` property. Matching on the attribute would therefore report zero nonces on
     * a perfectly working page, which is a false failure that costs an afternoon.
     */
    const scripts = await page.evaluate(() =>
      [...document.querySelectorAll('script')].map((script) => ({
        nonce: script.nonce,
        inline: script.src === '',
        // Enough to identify the offender in a CI log without dumping a bundle into it.
        hint: script.src === '' ? script.textContent?.slice(0, 60) : new URL(script.src).pathname,
      })),
    );

    // A page with no scripts at all would pass every assertion below, vacuously.
    expect(
      scripts.length,
      `${route} served no scripts, so this test proved nothing`,
    ).toBeGreaterThan(0);

    const unnonced = scripts.filter((script) => script.nonce !== nonce);
    expect(
      unnonced,
      `scripts on ${route} whose nonce does not match the policy:\n${unnonced
        .map((script) => `  ${script.inline ? 'inline' : 'external'} ${script.hint ?? ''}`)
        .join('\n')}`,
    ).toEqual([]);

    expect(violations, `the browser reported CSP violations on ${route}`).toEqual([]);
  });
}

test('the page hydrates under the policy', async ({ page }) => {
  const violations = await collectViolations(page);

  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');

  /**
   * The mobile menu as the hydration probe.
   *
   * Server-rendered HTML alone cannot open it - the disclosure state lives in React - so a menu that
   * responds is proof that the client bundle downloaded, parsed, and executed under the enforced policy.
   * This is the assertion that would have caught the prerendered-homepage bug on its own, without anyone
   * having to think about nonces.
   */
  const menu = page.getByRole('button', { name: /menu/i });
  await menu.scrollIntoViewIfNeeded();
  // Decorative article imagery can sit under the sticky header in hit-test geometry; force avoids a
  // false failure when `pointer-events` is already disabled on the image.
  await menu.click({ force: true });
  await expect(page.getByRole('navigation', { name: /main/i }).last()).toBeVisible();

  expect(violations, 'the browser reported CSP violations while hydrating').toEqual([]);
});

test('the response carries the rest of the security headers', async ({ page }) => {
  const response = await page.goto('/');
  const headers = response?.headers() ?? {};

  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toContain('camera=()');

  // Correlates a browser session with a server log line. Phase 10's support workflow depends on it.
  expect(headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);

  /**
   * No HSTS from the application, on purpose.
   *
   * Caddy terminates TLS and owns transport headers (Phase 13). Two sources for `Strict-Transport-Security`
   * is how a `max-age` of 31536000 ends up shadowed by a stale one of 0, and the application cannot know
   * whether it is being served over HTTPS in the first place.
   */
  expect(headers['strict-transport-security']).toBeUndefined();
});

test('an unauthenticated visitor is redirected away from the account area', async ({ page }) => {
  const response = await page.goto('/account/enquiries');

  expect(new URL(page.url()).pathname).toBe('/auth/sign-in');
  expect(new URL(page.url()).searchParams.get('next')).toBe('/account/enquiries');
  expect(response?.status()).toBe(200);
});
