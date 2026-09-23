/**
 * The routes every browser suite walks.
 *
 * One list, shared, rather than a literal in each spec. The security check, the accessibility sweep, and
 * the visual baselines all want "every public page", and three copies of that answer means a route added
 * in Phase 07 gets picked up by whichever suite the author happened to remember.
 *
 * Authenticated routes are deliberately absent: `/account` and `/staff` redirect to sign-in without a
 * session cookie (`src/proxy.ts`), so a suite that listed them would be asserting about the sign-in page
 * under a misleading name. They join these lists in phases 11 and 12, behind a storage state.
 */

/** Pages a visitor can reach, in roughly the order the navigation offers them. */
export const PUBLIC_ROUTES = [
  '/',
  '/services',
  '/articles',
  '/about',
  '/contact',
  '/enquiry',
  '/faqs',
  '/search',
  '/privacy',
  '/terms',
  '/sitemap',
  '/auth/sign-in',
] as const;

/**
 * Routes whose screenshots are worth comparing between commits.
 *
 * A subset of the above, and a subset on purpose. A baseline for each of the twelve routes at each of
 * five widths is sixty images to review whenever the header padding changes, which is how a visual suite
 * stops being read. These five carry every distinct layout the shell produces: the homepage's five bands,
 * a prose page, a form-and-details page, a long policy document, and a placeholder.
 */
export const VISUAL_ROUTES = ['/', '/about', '/contact', '/privacy', '/services'] as const;

/**
 * Viewport widths from WP-04.4.
 *
 * 360 is the small-phone floor the reference's mobile column has to survive; 768 and 1024 straddle
 * Tailwind's `md` and `lg`, where the grids change column count; 1280 is the width the reference image
 * itself was composed at, so it is the one a side-by-side is meaningful at; 1440 checks that the
 * content container stops growing rather than stretching to the window.
 */
export const VIEWPORT_WIDTHS = [360, 768, 1024, 1280, 1440] as const;

/** A tall viewport, so a full-page screenshot needs as little scroll-stitching as possible. */
export const VIEWPORT_HEIGHT = 900;
