import { SkipLink } from '@cera/ui/skip-link';
import { Text } from '@cera/ui/typography';
import { ClipboardList, LogOut, Package, Truck } from 'lucide-react';

import { AppLink } from '../../components/link.tsx';
import { SiteWordmark } from '../../components/site-wordmark.tsx';

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
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-surface-subtle">
      <SkipLink targetId="main" />

      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-20 max-w-site items-center justify-between gap-4 px-4 sm:px-6 md:px-10">
          <div className="flex items-center gap-4">
            <SiteWordmark />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <Text size="eyebrow" tone="muted" className="hidden sm:inline">
              Staff Console
            </Text>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <AppLink
              href="/staff/orders"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-tint hover:text-heading"
            >
              <Package size={14} /> Orders & Dispatch
            </AppLink>
            <AppLink
              href="/staff"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-tint hover:text-heading"
            >
              <ClipboardList size={14} /> Enquiry CRM
            </AppLink>
            <AppLink
              href="/staff/deliveries"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:bg-surface-tint hover:text-heading"
            >
              <Truck size={14} /> Deliveries
            </AppLink>
          </nav>

          <div className="flex items-center gap-3">
            <AppLink
              href="/auth/signout?audience=staff"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-heading"
            >
              <LogOut aria-hidden size={13} /> Sign out
            </AppLink>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="flex-1 focus-visible:outline-none">
        {children}
      </main>
    </div>
  );
}
