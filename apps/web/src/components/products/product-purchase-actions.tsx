'use client';

import { ButtonLink } from '@cera/ui/button';

import { checkoutEnabled } from '../../lib/checkout-enabled.ts';
import { AddToCartButton } from '../add-to-cart-button.tsx';
import { AppLink } from '../link.tsx';

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
      <ButtonLink href={enquiryHref} as={AppLink} variant="primary" size={compact ? 'sm' : 'md'}>
        Request
      </ButtonLink>
    );
  }

  return (
    <div
      className={`flex flex-col gap-2 ${compact ? 'min-w-[9rem]' : 'sm:flex-row sm:items-center'}`}
    >
      <AddToCartButton slug={sku} label={compact ? 'Add to cart' : 'Add to cart'} />
      <ButtonLink
        href={enquiryHref}
        as={AppLink}
        variant="outline"
        size={compact ? 'sm' : 'md'}
        className="justify-center"
      >
        Request quote
      </ButtonLink>
    </div>
  );
}
