import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Guards the font configuration against one specific, silent regression.
 *
 * Asserted against the source text rather than the module's exports, because importing
 * `next/font/google` outside the Next compiler throws - the loader is a build-time transform, not
 * a runtime library. Checking the source is cruder than checking behaviour, and it is the only
 * check available at unit-test speed. The behavioural version belongs in the Playwright run,
 * where a real browser can report the computed font stack.
 *
 * What it protects: supplying `fallback` to a `next/font/google` call **replaces** the
 * metric-matched fallback that `adjustFontFallback` generates, rather than appending to it.
 * Nothing warns. The build output loses its `size-adjust` and `ascent-override` declarations, and
 * the `display: 'swap'` handover starts shifting the page - a Cumulative Layout Shift regression
 * on the largest text block, invisible locally where the font is already cached.
 *
 * `fallback: ['ui-sans-serif', 'system-ui', 'sans-serif']` is the natural thing to write, looks
 * more careful than omitting it, and quietly disables the protection. Hence a test.
 */

const FONTS_PATH = join(dirname(fileURLToPath(import.meta.url)), 'fonts.ts');

/**
 * The file with comments removed.
 *
 * Necessary because the comments in `fonts.ts` discuss the very options being counted - they
 * explain why there is no `fallback` and why `display: 'swap'` is the right choice - so matching
 * the raw text counts the prose alongside the code and the numbers come out wrong.
 */
const source = readFileSync(FONTS_PATH, 'utf8')
  .replaceAll(/\/\*[\s\S]*?\*\//g, '')
  .replaceAll(/\/\/.*$/gm, '');

describe('font configuration', () => {
  it('passes no fallback array, which would replace the metric-matched fallback', () => {
    // The generic families live in `theme.css` on `--font-sans` instead, which is where a
    // design-system default belongs.
    expect(source).not.toMatch(/^\s*fallback:/m);
  });

  it('keeps adjustFontFallback on for both families', () => {
    const occurrences = source.match(/adjustFontFallback:\s*true/g) ?? [];

    expect(occurrences).toHaveLength(2);
  });

  it('uses swap rather than optional, so the brand face is not abandoned on a slow connection', () => {
    const occurrences = source.match(/display:\s*'swap'/g) ?? [];

    expect(occurrences).toHaveLength(2);
  });

  it('subsets to latin so an unused script is not downloaded', () => {
    const occurrences = source.match(/subsets:\s*\['latin'\]/g) ?? [];

    expect(occurrences).toHaveLength(2);
  });

  it('assigns both faces to the variables theme.css consumes', () => {
    // `theme.css` reads these exact names into `--font-sans` and `--font-wordmark`. A rename here
    // leaves the token resolving to nothing, and the page silently renders in the system font.
    expect(source).toContain("variable: '--font-source-sans-3'");
    expect(source).toContain("variable: '--font-montserrat'");
  });

  it('loads only the weights the design system uses', () => {
    // design-language.md section 2: 400/600/700 for the UI face, 600/700 for the wordmark.
    expect(source).toContain("weight: ['400', '600', '700']");
    expect(source).toContain("weight: ['600', '700']");
  });
});
