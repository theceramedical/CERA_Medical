'use client';

import { Heading, Text } from '@cera/ui/typography';
import { useEffect, useState } from 'react';

import type { Cart } from '@cera/contracts';

import { fetchCart, mergeCartState } from '../lib/cart-client.ts';

import { formatCartMoney } from './cart-mini-panel.tsx';
import { AppButtonLink, AppLink } from './link.tsx';

export function CartPageView({ initialCart }: { readonly initialCart: Cart }) {
  const [cart, setCart] = useState(initialCart);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void fetchCart()
      .then((next) => {
        setCart((previous) => mergeCartState(previous, next));
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready) {
    return <Text tone="muted">Loading your cart…</Text>;
  }

  if (cart.lines.length === 0) {
    return (
      <Text tone="muted">
        Your cart is empty. <AppLink href="/products">Browse products</AppLink> or{' '}
        <AppLink href="/services">research services</AppLink>.
      </Text>
    );
  }

  return (
    <>
      <ul className="divide-y divide-border rounded-lg border border-border bg-surface p-0">
        {cart.lines.map((line) => (
          <li
            key={line.id}
            className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <Text className="font-semibold">{line.title}</Text>
              <Text size="body-sm" tone="muted">
                Qty {line.quantity} · {line.slug}
              </Text>
            </div>
            <Text className="font-mono text-body-sm">
              {formatCartMoney(line.lineTotalMinor, cart.currencyCode)}
            </Text>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <Heading level={2} size="h4">
          Total{' '}
          <span className="font-mono">{formatCartMoney(cart.totalMinor, cart.currencyCode)}</span>
        </Heading>
        <AppButtonLink href="/checkout" variant="primary">
          Proceed to checkout
        </AppButtonLink>
      </div>
    </>
  );
}
