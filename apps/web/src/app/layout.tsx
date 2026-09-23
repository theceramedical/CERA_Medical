import { fontVariables } from './fonts.ts';

import type { Metadata, Viewport } from 'next';

import './globals.css';

/**
 * The root layout.
 *
 * Deliberately minimal at this phase: Phase 03 exists to prove the design system, and Phase
 * 04 builds the header, footer, and skip link that belong here. What is here now is what the
 * design system needs in order to be rendered correctly at all - the font variables, the
 * language, and the viewport.
 */

export const metadata: Metadata = {
  // A template rather than a fixed string, so every route contributes its own title without
  // repeating the brand. Phase 07 sets canonicals and Open Graph.
  title: {
    default: 'CERA Medical',
    template: '%s | CERA Medical',
  },
  description: 'Trusted medical services, made easier to access.',
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
