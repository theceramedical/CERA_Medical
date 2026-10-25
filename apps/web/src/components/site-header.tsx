import NextLink from 'next/link';

import { sessionHasStaffRole } from '../lib/auth/portal-access.ts';
import { getSession } from '../lib/auth/session.ts';

import { AppButtonLink } from './link.tsx';
import { MAIN_NAV } from './navigation.ts';
import { HeaderScrollShadow } from './site-header.client.tsx';
import { DesktopNavLinks } from './site-nav-links.client.tsx';
import { MobileNav } from './site-nav.client.tsx';
import { SiteWordmark } from './site-wordmark.tsx';

/**
 * The site header (design-language.md section 5.5): 80px tall, wordmark left, five nav items centred,
 * a search button and two calls to action on the right. Products sits after Services.
 *
 * A server component, with three small client islands inside it. That split is the point rather than
 * an accident: the header is on every page, so anything that becomes client code here becomes client
 * code everywhere. What genuinely needs the browser is the scroll shadow, the active-item marking
 * (which needs `usePathname`), and the mobile disclosure. Everything else - the markup, the wordmark,
 * the two buttons, the landmark structure - renders on the server and ships no JavaScript.
 */
export async function SiteHeader() {
  const session = await getSession();
  const navItems = MAIN_NAV;
  const signedIn = session !== null;
  const staff = session !== null && sessionHasStaffRole(session);
  return (
    <HeaderScrollShadow>
      <div className="mx-auto flex h-20 min-w-0 max-w-site items-center gap-2 px-4 sm:gap-4 sm:px-6 md:px-10">
        {/*
         * The wordmark links home, and the link wraps the lock-up rather than the lock-up
         * accepting an `href`. `Wordmark` renders a `div` by default and declares no anchor props;
         * asking it to be an `<a>` through `as` would type-check and produce a link with no
         * `href`, which is a tab stop that does nothing.
         */}
        <NextLink
          href="/"
          className="inline-block shrink-0 rounded-md no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          // The wordmark already reads "CERA MEDICAL"; an `aria-label` here would replace that with
          // whatever text we chose and hide the real words. The link's purpose - going home - is
          // conventional enough that a logo link needs no further explanation.
        >
          <SiteWordmark as="span" />
        </NextLink>

        {/*
         * `<nav aria-label="Main">`. The label matters because there are three navigation
         * landmarks on a public page - this, the footer's columns, and breadcrumbs on interior
         * pages - and a screen reader's landmark list reading "navigation, navigation, navigation"
         * is a list you cannot navigate by.
         */}
        <nav aria-label="Main" className="hidden flex-1 justify-center lg:flex">
          <DesktopNavLinks items={navItems} />
        </nav>

        <div className="relative z-50 flex flex-1 items-center justify-end gap-2 lg:flex-none">
          <div className="hidden items-center gap-2 lg:flex">
            <AppButtonLink href="/contact#enquiry" variant="accent" size="sm">
              Make an Enquiry
            </AppButtonLink>
          </div>

          <MobileNav items={navItems} signedIn={signedIn} staff={staff} />
        </div>
      </div>
    </HeaderScrollShadow>
  );
}
