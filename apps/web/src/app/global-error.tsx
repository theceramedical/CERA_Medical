'use client';

import { fontVariables } from './fonts.ts';

import './globals.css';

/**
 * The last-resort boundary: an error thrown by the root layout itself.
 *
 * **It renders its own `<html>` and `<body>`,** which is the entire reason this file is separate from
 * `error.tsx`. If the root layout is what failed, there is no `<html>` element - so a boundary that
 * returned a fragment would have nowhere to render, and the browser would receive a document with no
 * root. This file is what stands in for the whole document in that case.
 *
 * Because it replaces the root layout, it cannot rely on anything the root layout provides. That is
 * why the font variables and the stylesheet are imported again here rather than inherited.
 *
 * **No design system imports, and that is deliberate.** This boundary catches failures in the layout
 * that renders the design system's provider tree and font variables. A component from `@cera/ui` is
 * the most likely thing to have thrown, and reaching for one here risks the boundary throwing while
 * handling the throw - which produces an unrecoverable blank page instead of a legible one. The markup
 * below is plain elements and token utility classes only.
 *
 * In practice this should never render. It exists for the case where it does, and the bar it has to
 * clear is "legible, with a heading and a way out", not "consistent with the rest of the site".
 */
export default function GlobalError() {
  return (
    <html lang="en-GB" className={fontVariables}>
      <body className="bg-surface">
        <main className="mx-auto flex min-h-dvh max-w-measure flex-col items-center justify-center px-6 text-center">
          {/* A real `h1`. This is the whole document, so it needs a top-level heading or a screen
              reader user has nothing to orient by on the one page that most needs explaining. */}
          <h1 className="text-h2 text-heading">Something went wrong</h1>

          <p className="mt-4 text-body-lg text-muted">
            The site could not be loaded. Reloading the page usually resolves it.
          </p>

          {/*
           * A plain anchor to `/`, not a `reset()` button.
           *
           * `reset` re-renders the root layout - the thing that just failed - so on a persistent
           * fault it fails again and the page appears to do nothing when clicked. A full navigation
           * discards all client state, which is what is actually wanted when the root is broken.
           */}
          {/*
           * The shared rule pushes internal navigation towards `next/link`, and it is right
           * everywhere else. Here the router lives inside the tree that just failed, so a client
           * navigation would re-render the broken root instead of replacing the document.
           */}
          {/*
           * A disable/enable pair rather than `eslint-disable-next-line`, because the rule reports the
           * `href` attribute and Prettier decides whether that lands on the same line as the `<a` based
           * on how long the className happens to be. It has already moved once, which turned the
           * suppression into an unused-directive warning and briefly un-suppressed the rule.
           */}
          {/* eslint-disable no-restricted-syntax -- a full page load is the point */}
          <a
            href="/"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-primary px-6 text-button text-on-primary no-underline"
          >
            Reload the site
          </a>
          {/* eslint-enable no-restricted-syntax */}
        </main>
      </body>
    </html>
  );
}
