import { Icon } from '@cera/ui/icon';
import { Wordmark } from '@cera/ui/wordmark';
import { Search } from 'lucide-react';
import NextLink from 'next/link';

import { checkoutEnabled } from '../lib/checkout-enabled.ts';
import { getPublicGlobal } from '../lib/cms/client.ts';

import { AppButtonLink } from './link.tsx';
import { MAIN_NAV, withProductsNav } from './navigation.ts';
import { HeaderScrollShadow } from './site-header.client.tsx';
import { DesktopNavLinks } from './site-nav-links.client.tsx';
import { MobileNav } from './site-nav.client.tsx';

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
  const navigation = await getPublicGlobal<{ header?: readonly { label: string; href: string }[] }>(
    'navigation',
  );
  const navItems = withProductsNav(navigation?.header?.length ? navigation.header : MAIN_NAV);
  return (
    <HeaderScrollShadow>
      <div className="mx-auto flex h-20 max-w-site items-center gap-4 px-6 md:px-10">
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
          <Wordmark as="span" />
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

        <div className="flex flex-1 items-center justify-end gap-2 lg:flex-none">
          {/*
           * Search is a link to a page, not a button that opens a widget. Phase 07 builds the
           * search route; a real page is reachable, linkable, and works without JavaScript, and it
           * does not need the combobox pattern that an inline widget would require.
           */}
          {checkoutEnabled() ? (
            <NextLink
              href="/cart"
              className="hidden rounded-md px-2 py-1 text-body-sm font-medium text-neutral-700 no-underline hover:bg-surface-subtle sm:inline-flex"
            >
              Cart
            </NextLink>
          ) : null}
          <NextLink
            href="/search"
            className="inline-flex size-11 items-center justify-center rounded-md text-neutral-700 transition-colors duration-base ease-standard hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            <Icon icon={Search} size="md" label="Search the site" />
          </NextLink>

          {/* Hidden below `lg`, where the same destinations are inside the disclosure. Rendering
              them twice and hiding one copy would put two "Sign In" links in the tab order. */}
          <div className="hidden items-center gap-2 lg:flex">
            <AppButtonLink href="/auth/sign-in" variant="outline" size="sm">
              Sign In
            </AppButtonLink>
            <AppButtonLink href="/enquiry" variant="accent" size="sm">
              Make an Enquiry
            </AppButtonLink>
          </div>

          <MobileNav items={navItems} />
        </div>
      </div>
    </HeaderScrollShadow>
  );
}
