'use client';

import { LabMouseIcon } from '../icons/lab-mouse-icon.tsx';
import { AppButtonLink } from '../link.tsx';

export function ProductPurchaseActions({
  enquiryHref,
  compact = false,
  label = 'Enquire',
}: {
  readonly enquiryHref: string;
  readonly compact?: boolean;
  readonly label?: string;
}) {
  return (
    <AppButtonLink
      href={enquiryHref}
      variant="primary"
      size={compact ? 'sm' : 'md'}
      iconStart={<LabMouseIcon size={14} className="transition-transform group-hover:scale-110" />}
    >
      {label}
    </AppButtonLink>
  );
}
