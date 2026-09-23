import { SkipLink } from '@cera/ui/skip-link';
import { Text } from '@cera/ui/typography';
import { Wordmark } from '@cera/ui/wordmark';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * The staff console shell. Phase 12 builds the queue, the transitions, and the audit history.
 *
 * Separate from the public tree from the start, which is the point of the route group: the staff
 * console is not a public page with extra permissions, and building it inside `(public)` would mean
 * every staff route inheriting a marketing header and a newsletter form, then removing them.
 *
 * The wordmark does not link home. A staff member who clicks a logo out of habit and lands on the
 * marketing site has lost their place in a work queue; there is nothing to gain from the convention
 * here.
 */

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function StaffLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-subtle">
      <SkipLink targetId="main" />

      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-20 max-w-site items-center gap-4 px-6 md:px-10">
          <Wordmark />

          {/*
           * Labelling the console visibly, so someone with both this and the public site open knows
           * which is which at a glance. It is a `Text`, not a heading: the page's own `h1` says what
           * the page is, and a heading here would take that level.
           */}
          <Text size="eyebrow" tone="muted">
            Staff console
          </Text>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 focus-visible:outline-none">
        {children}
      </main>
    </div>
  );
}
