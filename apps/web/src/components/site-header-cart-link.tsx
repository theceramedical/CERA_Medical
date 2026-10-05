'use client';

import { cn } from '@cera/ui/cn';
import { Icon } from '@cera/ui/icon';
import { ShoppingCart } from 'lucide-react';
import NextLink from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { cartItemCount, fetchCart } from '../lib/cart-client.ts';

export const CART_UPDATED_EVENT = 'cera:cart-updated';

export function SiteHeaderCartLink({ className }: { readonly className?: string }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    void fetchCart()
      .then((cart) => setCount(cartItemCount(cart)))
      .catch(() => setCount(0));
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener(CART_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdate);
  }, [refresh]);

  return (
    <NextLink
      href="/cart"
      className={cn(
        'relative inline-flex size-11 items-center justify-center rounded-md text-neutral-700 transition-colors duration-base ease-standard hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        className,
      )}
      aria-label={count > 0 ? `Cart, ${String(count)} items` : 'Cart'}
    >
      <Icon icon={ShoppingCart} size="md" />
      {count > 0 ? (
        <span
          className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[10px] font-bold leading-4 text-on-secondary"
          aria-hidden
        >
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </NextLink>
  );
}
