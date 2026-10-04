/**
 * The site's navigation, declared once.
 *
 * The header, the mobile disclosure, the footer's Quick Links column, and the human-readable sitemap
 * all render from these arrays. These arrays define the public navigation destinations, and
 * keeping them as three literals is how a renamed route ends up correct in the header and a 404 in
 * the footer - which nobody notices, because nobody clicks a footer link on a page they authored.
 *
 * Plain data in a non-`'use client'` module, so both server and client components can import it
 * without dragging a boundary along.
 */

export interface NavItem {
  readonly href: string;
  readonly label: string;
}

/** Header centre group. Products is the Stitch research-assets catalogue. */
export const MAIN_NAV: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/products', label: 'Products' },
  { href: '/articles', label: 'Research Updates' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/**
 * CMS navigation can lag a seed. Insert Products after Services when the global omits it.
 */
export function withProductsNav(items: readonly NavItem[]): readonly NavItem[] {
  if (items.some((item) => item.href === '/products')) return items;
  const product: NavItem = { href: '/products', label: 'Products' };
  const servicesIndex = items.findIndex((item) => item.href === '/services');
  if (servicesIndex === -1)
    return [items[0], product, ...items.slice(1)].filter(
      (item): item is NavItem => item !== undefined,
    );
  return [...items.slice(0, servicesIndex + 1), product, ...items.slice(servicesIndex + 1)];
}

/** Footer "Support" column, per section 5.9. */
export const SUPPORT_NAV: readonly NavItem[] = [
  { href: '/enquiry', label: 'Make an Enquiry' },
  { href: '/auth/sign-in', label: 'Sign In' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/data-retention', label: 'Data Retention Policy' },
  { href: '/privacy', label: 'Privacy Terms' },
  { href: '/terms', label: 'Terms of Service' },
];

/**
 * Where the social links point.
 *
 * Placeholders pending CERA's own accounts (PRD 22), and pointed at each platform's root rather than
 * at a guessed handle: a link to `/cera-medical` that does not exist is a broken link that looks
 * deliberate, whereas the root is merely unhelpful and obviously provisional.
 */
export const SOCIAL_LINKS = [
  { platform: 'linkedin', href: 'https://www.linkedin.com/' },
  { platform: 'facebook', href: 'https://www.facebook.com/' },
  { platform: 'instagram', href: 'https://www.instagram.com/' },
  { platform: 'youtube', href: 'https://www.youtube.com/' },
] as const;

/**
 * Whether a nav item is the page currently being viewed.
 *
 * `/` has to match exactly. Treating it as a prefix would mark Home as the current page on every
 * route on the site, which is worse than marking nothing: `aria-current="page"` on every item tells a
 * screen reader user that they are in five places at once.
 *
 * Everything else matches as a prefix, so `/articles/heart-health` keeps Articles marked. That is the
 * behaviour a user expects from a nav item that represents a section rather than a single page.
 */
export function isCurrent(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';

  return pathname === href || pathname.startsWith(`${href}/`);
}
