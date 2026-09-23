import { Montserrat, Source_Sans_3 } from 'next/font/google';

/**
 * The two faces from design-language.md section 2, self-hosted.
 *
 * `next/font/google` does not mean a request to Google at runtime. The files are downloaded at
 * build time and served from this origin, so there is no third-party connection, no `<link>` to
 * a CDN, and nothing for a blocked domain to stall. That last point is the practical one: a
 * `<link>` to `fonts.googleapis.com` is a render-blocking request to a domain that corporate
 * networks and privacy extensions do block, and when it stalls the page shows nothing at all.
 *
 * Both are exposed as CSS variables rather than class names, because `theme.css` assigns them
 * into `--font-sans` and `--font-wordmark`. A component asks for `font-sans`; it never names a
 * family.
 *
 * ---
 *
 * **There is deliberately no `fallback` option here, and that is the load-bearing detail.**
 *
 * `adjustFontFallback` generates a companion `@font-face` - `"Source Sans 3 Fallback"` - that is
 * `local("Arial")` with `ascent-override`, `descent-override`, and `size-adjust` computed from
 * the real font's metrics. That is what stops the `display: 'swap'` handover from shifting the
 * page: the stand-in occupies the same space as the webfont, so text does not reflow when the
 * real file arrives.
 *
 * Supplying a `fallback` array **replaces** that generated fallback instead of appending to it.
 * It is not additive, and nothing warns. Verified by building both ways: with
 * `fallback: ['ui-sans-serif', 'system-ui', 'sans-serif']` the output contained no `Fallback`
 * face and no `size-adjust` at all, and the family list was
 * `"Source Sans 3", ui-sans-serif, system-ui, sans-serif`. Removing it produced
 * `"Source Sans 3", "Source Sans 3 Fallback"` plus the metric overrides.
 *
 * So the version with an explicit fallback list silently disabled the CLS protection it looked
 * like it was configuring - the worst shape of defect, because the code reads as more careful
 * than the version that works.
 *
 * The generic tail is not lost. `theme.css` declares
 * `--font-sans: var(--font-source-sans-3), ui-sans-serif, system-ui, sans-serif`, so the
 * metric-matched fallback comes from `next/font` and the generic families come from the token
 * layer, which is where a design-system default belongs anyway.
 */

export const sourceSans3 = Source_Sans_3({
  // 400 body, 600 for h3/h4 and button labels, 700 for display and h1/h2. Listed explicitly
  // rather than taking the variable font's full range, so an unused weight is not downloaded.
  weight: ['400', '600', '700'],
  style: ['normal'],
  subsets: ['latin'],

  /**
   * `swap` shows the fallback immediately and replaces it when the real face arrives.
   *
   * The alternative, `optional`, avoids the swap entirely but silently abandons the font on a
   * slow first visit - so the brand face is absent for exactly the users most likely to be on a
   * poor connection. A brief handover is the better trade, and the metric-matched fallback
   * above is what keeps it from moving anything.
   */
  display: 'swap',

  adjustFontFallback: true,
  variable: '--font-source-sans-3',
});

/**
 * The `CERA` wordmark and the tracked `MEDICAL` beneath it, and nothing else.
 *
 * Two weights, because that is what the lock-up uses: 700 for `CERA`, 600 for `MEDICAL`. Loading
 * the rest would be bytes spent on a face that appears once per page, in the header.
 */
export const montserrat = Montserrat({
  weight: ['600', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
  adjustFontFallback: true,
  variable: '--font-montserrat',
});

/** Both font variables, for the `<html>` element. */
export const fontVariables = `${sourceSans3.variable} ${montserrat.variable}`;
