'use client';

import { checkoutEnabled } from '../../lib/checkout-enabled.ts';
import { AddToCartButton } from '../add-to-cart-button.tsx';
import { AppButtonLink } from '../link.tsx';

export function ProductPurchaseActions({
  sku,
  enquiryHref,
  compact = false,
}: {
  readonly sku: string;
  readonly enquiryHref: string;
  readonly compact?: boolean;
}) {
  if (!checkoutEnabled()) {
    return (
      <AppButtonLink href={enquiryHref} variant="primary" size={compact ? 'sm' : 'md'}>
        Request
      </AppButtonLink>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 ${compact ? 'min-w-[9rem]' : 'sm:flex-row sm:items-center'}`}
    >
      <AddToCartButton slug={sku} label={compact ? 'Add to cart' : 'Add to cart'} />
      <AppButtonLink
        href={enquiryHref}
        variant="outline"
        size={compact ? 'sm' : 'md'}
        className="justify-center"
      >
        Request quote
      </AppButtonLink>
    </div>
  );
}
