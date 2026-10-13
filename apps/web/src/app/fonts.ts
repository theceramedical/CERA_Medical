import localFont from 'next/font/local';

/**
 * Keep the Latin variable faces with the app so production and CI builds do not depend on
 * Google Fonts or Next's remote font loader. next/font/local still self-hosts the files and
 * generates a metric-adjusted Arial fallback to prevent layout shift during font swap.
 */
export const sourceSans3 = localFont({
  src: './font-files/source-sans-3-latin.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  adjustFontFallback: 'Arial',
  variable: '--font-source-sans-3',
});

export const montserrat = localFont({
  src: './font-files/montserrat-latin.woff2',
  weight: '600 700',
  style: 'normal',
  display: 'swap',
  adjustFontFallback: 'Arial',
  variable: '--font-montserrat',
});

/** Both font variables, for the `<html>` element. */
export const fontVariables = `${sourceSans3.variable} ${montserrat.variable}`;
