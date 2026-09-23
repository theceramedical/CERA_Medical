import { SkipLink } from '@cera/ui/skip-link';
import { Wordmark } from '@cera/ui/wordmark';
import NextLink from 'next/link';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * The customer portal shell. Phase 11 builds what goes inside it.
 *
 * Separate from the public layout from the start, rather than retrofitted later, because the
 * differences are structural. There is no marketing header, no four-column footer, and no
 * "Make an Enquiry" call to action - a signed-in customer looking at their own enquiry does not need
 * to be sold the thing they already did.
 */

export const metadata: Metadata = {
  /**
   * Excluded from search indexes for the whole subtree.
   *
   * Belt and braces: `proxy.ts` sends an unauthenticated request here to sign-in, so a crawler should
   * never see a portal page at all. But a crawler that follows a link into a page which is
   * accidentally reachable will index it, and a cached portal page in a search result is a data
   * exposure. Declaring it on the layout means every future route under `/account` inherits it
   * without anyone having to remember.
   */
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { readonly children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-subtle">
      <SkipLink targetId="main" />

      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-20 max-w-site items-center px-6 md:px-10">
          <NextLink
            href="/"
            className="inline-block rounded-md no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Wordmark as="span" />
          </NextLink>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 focus-visible:outline-none">
        {children}
      </main>
    </div>
  );
}
