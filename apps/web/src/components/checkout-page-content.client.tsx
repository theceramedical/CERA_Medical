'use client';

import { Text } from '@cera/ui/typography';
import { useEffect, useState } from 'react';

import type { Cart } from '@cera/contracts';

import { fetchCart, mergeCartState } from '../lib/cart-client.ts';

import { formatCartMoney } from './cart-mini-panel.tsx';
import { CheckoutForm } from './checkout-form.client.tsx';
import { AppButtonLink } from './link.tsx';

export function CheckoutPageContent() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void fetchCart()
      .then((next) => {
        setCart((previous) => (previous === null ? next : mergeCartState(previous, next)));
        setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  if (!ready) {
    return <Text tone="muted">Loading checkout…</Text>;
  }

  if (cart === null || cart.lines.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <Text tone="muted">
          Your cart is empty or could not be loaded. Add a product, then return here to pay.
        </Text>
        <AppButtonLink href="/products" variant="primary">
          Browse products
        </AppButtonLink>
      </div>
    );
  }

  return (
    <CheckoutForm
      cartTotalLabel={formatCartMoney(cart.totalMinor, cart.currencyCode)}
      showTestPayment={process.env.NODE_ENV !== 'production'}
    />
  );
}
