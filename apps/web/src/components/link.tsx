import { ButtonLink as UiButtonLink } from '@cera/ui/button';
import { Link as UiLink } from '@cera/ui/link';
import NextLink from 'next/link';

import type { ButtonLinkProps as UiButtonLinkProps } from '@cera/ui/button';
import type { LinkProps as UiLinkProps } from '@cera/ui/link';

import type { ComponentProps } from 'react';

/**
 * `@cera/ui`'s `Link`, bound to `next/link`.
 *
 * The design system takes the link component through a prop rather than importing `next/link`
 * itself, and that is deliberate: `packages/ui` must never acquire a Next dependency, or it stops
 * being renderable in a jsdom test and in a Storybook-style preview. The binding has to happen
 * somewhere, and doing it once here means no call site has to remember `as={NextLink}` - which is a
 * prop whose omission costs client-side navigation and produces no error at all.
 *
 * External links keep the plain anchor. `next/link` on an off-origin URL adds a prefetch attempt and
 * a router entry for a destination the router will never own.
 */
/**
 * Anything the router cannot own: another origin, or a different scheme entirely.
 *
 * `mailto:` and `tel:` are the ones that actually turn up, and handing either to `next/link` gets a
 * prefetch attempt and a history entry for a destination that is not a page. Detected from the href
 * rather than left to an `external` prop, because the prop is easy to forget and the failure is
 * invisible - the link works, it just quietly asks the router to prefetch an email address.
 */
const NON_ROUTER_HREF = /^(?:[a-z][\w+.-]*:|\/\/)/i;

/**
 * Prefetching a protected route before a session exists can leave Next's router with a cached
 * sign-in redirect. Account and staff links are infrequent, so load them only when clicked.
 */
function NoPrefetchNextLink(props: ComponentProps<typeof NextLink>) {
  return <NextLink {...props} prefetch={false} />;
}

function requiresSession(href: string): boolean {
  return (
    href === '/account' ||
    href.startsWith('/account/') ||
    href === '/staff' ||
    href.startsWith('/staff/')
  );
}

/** OIDC routes redirect off-site; prefetch/RSC fetch must not hit Authentik before a real navigation. */
function isOidcBrowserRoute(href: string): boolean {
  return (
    href === '/auth/signin' ||
    href.startsWith('/auth/signin?') ||
    href === '/auth/signout' ||
    href.startsWith('/auth/signout?')
  );
}

function requiresNoPrefetch(href: string): boolean {
  return requiresSession(href) || isOidcBrowserRoute(href);
}

export function AppLink({ external = false, href, ...rest }: UiLinkProps) {
  const oidcRoute = !external && isOidcBrowserRoute(href);
  const routable = !external && !oidcRoute && !NON_ROUTER_HREF.test(href);

  return (
    <UiLink
      as={routable ? (requiresNoPrefetch(href) ? NoPrefetchNextLink : NextLink) : 'a'}
      external={external}
      href={href}
      {...rest}
    />
  );
}

/**
 * `@cera/ui`'s `ButtonLink`, bound to `next/link`.
 *
 * `ButtonLink` rather than `Button` wherever a control navigates. The design system keeps them as
 * separate components on purpose - a navigating control must be an anchor, or middle-click,
 * ctrl-click, "copy link address", and the browser's status bar all silently stop working - and this
 * is the binding that makes reaching for the right one no more effort than the wrong one.
 */
export function AppButtonLink({ href, ...props }: UiButtonLinkProps) {
  const linkAs =
    typeof href === 'string' && requiresNoPrefetch(href) ? NoPrefetchNextLink : NextLink;
  return <UiButtonLink as={linkAs} href={href} {...props} />;
}
