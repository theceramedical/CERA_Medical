import { SkipLink } from '@cera/ui/skip-link';
import { draftMode } from 'next/headers';

import { LivePreview } from '../../components/live-preview.client.tsx';
import { SiteAnnouncementBar } from '../../components/site-announcement-bar.tsx';
import { SiteFooter } from '../../components/site-footer.tsx';
import { SiteHeader } from '../../components/site-header.tsx';

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

/**
 * The public site's shell: skip link, header, main landmark, footer.
 *
 * The three route groups have separate layouts because they have genuinely different chrome, not
 * merely different styling. The portal and the staff console do not carry the marketing header or the
 * four-column footer, and their auth posture differs - a single shared shell would mean every group
 * passing props to switch off the other groups' pieces, which is the arrangement that ends up with
 * the staff console rendering a "Make an Enquiry" button.
 */
export async function generateMetadata(): Promise<Metadata> {
  const draft = await draftMode();
  if (!draft.isEnabled) return {};

  // Preview links are never indexable. Draft mode is a cookie, not a path, so
  // robots.txt cannot name it; this header is the control that is actually on
  // the response a crawler would receive if it somehow presented the cookie.
  return { robots: { index: false, follow: false } };
}

export default async function PublicLayout({ children }: { readonly children: ReactNode }) {
  const draft = await draftMode();
  const cmsUrl = process.env.CMS_URL ?? 'http://localhost:3001';

  return (
    /**
     * `min-h-dvh` with the footer pushed down by `flex-1` on `<main>`.
     *
     * Not decoration: without it, a short page - a 404, or an interior page before its content
     * arrives - leaves the footer floating in the middle of the viewport with blank space beneath,
     * which reads as a failed render. `dvh` rather than `vh` because mobile browsers shrink the
     * viewport as their toolbar appears, and `vh` is measured against the larger of the two.
     */
    <div className="flex min-h-dvh flex-col">
      {/*
       * First in the DOM, so it is the first thing Tab reaches. That is the whole requirement of
       * SC 2.4.1 and it is positional - a skip link placed anywhere else is a skip link that is
       * reached after the thing it exists to skip.
       */}
      <SkipLink targetId="main" />

      {draft.isEnabled ? <LivePreview serverURL={cmsUrl} /> : null}

      <SiteHeader />

      <SiteAnnouncementBar />

      {/*
       * `id="main"` matches the skip link's target, and `tabIndex={-1}` is what makes the jump
       * actually move focus. Without it the browser scrolls to the element and leaves focus on the
       * link, so the next Tab continues through the header the user just asked to skip - the classic
       * skip link that appears to work and does nothing.
       */}
      <main id="main" tabIndex={-1} className="flex-1 focus-visible:outline-none">
        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
