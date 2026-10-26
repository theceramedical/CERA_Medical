import NextLink from 'next/link';

import { sessionHasStaffRole } from '../lib/auth/portal-access.ts';
import { getSession } from '../lib/auth/session.ts';

import { AppButtonLink } from './link.tsx';
import { MAIN_NAV } from './navigation.ts';
import { SiteHeaderAuthActions } from './site-header-auth-actions.tsx';
import { HeaderScrollShadow } from './site-header.client.tsx';
import { DesktopNavLinks } from './site-nav-links.client.tsx';
import { MobileNav } from './site-nav.client.tsx';
import { SiteWordmark } from './site-wordmark.tsx';

/** Global navigation follows the approved October 2026 client structure. */
export async function SiteHeader() {
  const session = await getSession();
  const signedIn = session !== null;
  const staff = session !== null && sessionHasStaffRole(session);
  return (
    <HeaderScrollShadow>
      <div className="mx-auto flex h-20 min-w-0 max-w-site items-center gap-3 px-4 sm:gap-4 sm:px-6 md:px-10">
        <NextLink
          href="/"
          className="inline-block shrink-0 rounded-md no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <SiteWordmark as="span" />
        </NextLink>

        <nav aria-label="Main" className="hidden flex-1 justify-center lg:flex">
          <DesktopNavLinks items={MAIN_NAV} />
        </nav>

        <div className="relative z-50 flex flex-1 items-center justify-end gap-2 lg:flex-none">
          <div className="hidden items-center lg:flex">
            <SiteHeaderAuthActions signedIn={signedIn} staff={staff} />
            <AppButtonLink href="/contact#contact-form" variant="accent" size="sm">
              Make an Enquiry
            </AppButtonLink>
          </div>
          <MobileNav items={MAIN_NAV} signedIn={signedIn} staff={staff} />
        </div>
      </div>
    </HeaderScrollShadow>
  );
}
