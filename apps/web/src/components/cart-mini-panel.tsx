'use client';

import { ButtonLink } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';

import type { Cart } from '@cera/contracts';

import { AppLink } from './link.tsx';

export function formatCartMoney(minor: number, currencyCode: string): string {
  const major = minor / 100;
  try {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currencyCode}`;
  }
}

export function CartMiniPanel({
  cart,
  onCheckout,
}: {
  readonly cart: Cart;
  readonly onCheckout?: () => void;
}) {
  if (cart.lines.length === 0) {
    return (
      <Text size="body-sm" tone="muted" className="px-1 py-2">
        Your cart is empty.{' '}
        <AppLink href="/products" className="font-medium">
          Browse products
        </AppLink>
      </Text>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="max-h-64 list-none space-y-3 overflow-y-auto p-0">
        {cart.lines.map((line) => (
          <li
            key={line.id}
            className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <Text size="body-sm" className="font-semibold text-copy">
                {line.title}
              </Text>
              <Text size="caption" tone="muted">
                Qty {line.quantity}
              </Text>
            </div>
            <Text size="body-sm" className="shrink-0 font-mono">
              {formatCartMoney(line.lineTotalMinor, cart.currencyCode)}
            </Text>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-border pt-3">
        <Text size="body-sm" className="font-semibold">
          Total
        </Text>
        <Text size="body-sm" className="font-mono font-semibold">
          {formatCartMoney(cart.totalMinor, cart.currencyCode)}
        </Text>
      </div>
      <div className="flex flex-col gap-2">
        <ButtonLink
          href="/checkout"
          as={AppLink}
          variant="primary"
          size="sm"
          className="w-full justify-center"
          onClick={onCheckout}
        >
          Checkout
        </ButtonLink>
        <AppLink href="/cart" className="text-center text-body-sm font-medium no-underline">
          View full cart
        </AppLink>
      </div>
    </div>
  );
}
