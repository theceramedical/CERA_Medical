import { siteUrl } from '../lib/site-url.ts';

import { fontVariables } from './fonts.ts';

import type { Metadata, Viewport } from 'next';

import './globals.css';

/**
 * The root layout: the `<html>` and `<body>` elements, the font variables, and the rendering mode.
 *
 * The shell - skip link, header, footer - is not here. It belongs to each route group, because the
 * three groups have genuinely different chrome: the public site has the marketing header, the portal
 * and the staff console do not, and a single shared shell would mean every group carrying props to
 * turn the other groups' pieces off.
 */

/**
 * Every document is rendered per request, because the Content-Security-Policy carries a nonce.
 *
 * This is the whole reason, and it is not optional. `proxy.ts` mints a nonce per request and Next
 * stamps it onto every `<script>` it emits - but a statically prerendered page is HTML built before
 * any request existed, so it carries no nonce, and the policy on the response then blocks every
 * script on it. The measured result before this line was added: nine script tags, zero nonces, a page
 * that rendered correctly and never hydrated. No error, no warning, nothing a build would catch.
 *
 * Declared here rather than left to happen as a side effect of reading `headers()` somewhere, so it
 * is greppable and survives a tidy-up. ADR-010 records what is given up - the full-route HTML cache
 * and incremental static regeneration - and why the trade lands this way for a CMS-backed medical
 * site. A Playwright check asserts every script on every route carries a nonce, so a route that
 * somehow escapes this fails a test rather than shipping broken.
 */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  /**
   * `metadataBase` is what makes every relative URL in metadata resolve.
   *
   * Without it, `alternates.canonical: '/'` and the Open Graph image resolve to relative URLs, which
   * both specifications ignore - silently. Next warns about it in development and not in production, so
   * the absence is the kind of thing that ships.
   */
  metadataBase: siteUrl(),

  // A template rather than a fixed string, so every route contributes its own title without
  // repeating the brand. A route wanting to opt out uses `title: { absolute: ... }`.
  title: {
    default: 'CERA Medical',
    template: '%s | CERA Medical',
  },
  description: 'Trusted medical services, made easier to access.',

  /**
   * A self-referencing canonical on every page.
   *
   * `'./'` resolves against `metadataBase` *and* the current path, so each route declares itself
   * canonical without repeating it. This is what stops the same page being indexed separately under a
   * tracking parameter, a trailing slash, and an uppercase path - three URLs competing with each other
   * for the same terms.
   */
  alternates: { canonical: './' },

  openGraph: {
    type: 'website',
    siteName: 'CERA Medical',
    locale: 'en_GB',
    url: './',
  },

  /**
   * `summary_large_image` rather than `summary`.
   *
   * The difference is whether a shared link renders as a thumbnail beside two lines of text or as a
   * full-width card. Phase 07 adds the image itself; declaring the card type now means the tag is not
   * forgotten alongside it, and a `summary_large_image` with no image degrades to a plain link rather
   * than to a broken one.
   */
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,

  /**
   * No `maximumScale` and no `userScalable: false`.
   *
   * Setting either breaks WCAG 1.4.4, which requires text to scale to 200%. It is a common
   * thing to add to stop iOS zooming on input focus, and the correct fix for that is a 16px
   * minimum font size on controls - which design-language.md section 5.10 already mandates -
   * rather than removing the user's ability to zoom.
   */
};

export default function RootLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    // `lang` is not decoration: it selects the screen reader's pronunciation rules, and a
    // missing or wrong value makes English read as though it were another language.
    <html lang="en-GB" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
