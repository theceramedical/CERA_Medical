'use client';

import { AppButtonLink } from '../link.tsx';

export function ProductPurchaseActions({
  enquiryHref,
  compact = false,
}: {
  readonly enquiryHref: string;
  readonly compact?: boolean;
}) {
  return (
    <AppButtonLink href={enquiryHref} variant="primary" size={compact ? 'sm' : 'md'}>
      Request
    </AppButtonLink>
  );
}
