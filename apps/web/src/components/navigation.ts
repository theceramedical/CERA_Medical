export interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly children?: readonly NavItem[];
}

export const MAIN_NAV: readonly NavItem[] = [
  { href: '/', label: 'Home' },
  {
    href: '/services',
    label: 'Services',
    children: [
      { href: '/services/preclinical-studies', label: 'Preclinical Studies' },
      { href: '/services/molecular-research', label: 'Molecular Research' },
      { href: '/services/biomedical-data-analysis', label: 'Biomedical Data Analysis' },
    ],
  },
  { href: '/products', label: 'Products' },
  { href: '/projects', label: 'Our Projects' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export const SERVICE_NAV: readonly NavItem[] = [
  { href: '/services/preclinical-studies', label: 'Preclinical Studies' },
  { href: '/services/molecular-research', label: 'Molecular Research' },
  { href: '/services/biomedical-data-analysis', label: 'Biomedical Data Analysis' },
];

export const FOOTER_SERVICE_NAV = SERVICE_NAV;
export const FOOTER_COMPANY_NAV: readonly NavItem[] = [
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Our Projects' },
  { href: '/products', label: 'Products' },
  { href: '/contact', label: 'Contact' },
];
export const FOOTER_POLICY_NAV: readonly NavItem[] = [
  { href: '/faqs', label: 'FAQs' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/privacy', label: 'Privacy Terms' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/data-retention', label: 'Data Retention Policy' },
];

/** Compatibility helper for older callers; the approved navigation already includes Products. */
export function withProductsNav(items: readonly NavItem[]): readonly NavItem[] {
  return items;
}

/** Legacy footer export retained for import compatibility; Sign In is intentionally absent. */
export const SUPPORT_NAV = FOOTER_POLICY_NAV;
export function supportNavForSession(_signedIn: boolean): readonly NavItem[] {
  return [
    { href: '/auth/sign-in?next=/account', label: 'Sign In' },
    ...FOOTER_POLICY_NAV,
  ];
}

export function isCurrent(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
