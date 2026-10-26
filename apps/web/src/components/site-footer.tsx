import { Text } from '@cera/ui/typography';

import { AppLink } from './link.tsx';
import {
  FOOTER_COMPANY_NAV,
  FOOTER_POLICY_NAV,
  FOOTER_SERVICE_NAV,
} from './navigation.ts';
import { SiteWordmark } from './site-wordmark.tsx';

export function SiteFooter() {
  return (
    <footer className="bg-surface-footer">
      <div className="mx-auto grid max-w-site grid-cols-1 gap-9 px-6 py-12 sm:grid-cols-2 md:px-10 lg:grid-cols-[1.35fr_1fr_1fr_1fr_1fr]">
        <div>
          <SiteWordmark />
          <Text size="body-sm" tone="muted" className="mt-4 max-w-xs">
            Biomedical research and development in Haripur, Pakistan.
          </Text>
        </div>
        <FooterNav heading="Services" items={FOOTER_SERVICE_NAV} />
        <FooterNav heading="Company" items={FOOTER_COMPANY_NAV} />
        <FooterNav heading="Policies" items={FOOTER_POLICY_NAV} />
        <div>
          <h2 className="text-caption font-semibold tracking-[0.12em] text-heading uppercase">Contact</h2>
          <AppLink href="mailto:contact@ceramedical.org" className="mt-4 inline-flex min-h-11 items-center">
            contact@ceramedical.org
          </AppLink>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-site px-6 py-5 text-caption text-muted md:px-10">
          © 2026 CERA Medical. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

function FooterNav({
  heading,
  items,
}: {
  readonly heading: string;
  readonly items: readonly { href: string; label: string }[];
}) {
  return (
    <nav aria-label={heading}>
      <h2 className="text-caption font-semibold tracking-[0.12em] text-heading uppercase">{heading}</h2>
      <ul className="mt-3 list-none space-y-1 p-0">
        {items.map((item) => (
          <li key={item.href}>
            <AppLink href={item.href} className="inline-flex min-h-10 items-center text-body-sm">
              {item.label}
            </AppLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
