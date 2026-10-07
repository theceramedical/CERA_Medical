'use client';

import { cn } from '@cera/ui/cn';
import { Icon } from '@cera/ui/icon';
import { Text } from '@cera/ui/typography';
import { ShoppingCart } from 'lucide-react';
import NextLink from 'next/link';
import { useEffect, useId, useRef, useState, type Dispatch, type SetStateAction } from 'react';

import type { Cart } from '@cera/contracts';

import { cartItemCount, emptyCart, fetchCart, mergeCartState } from '../lib/cart-client.ts';

import { CartMiniPanel } from './cart-mini-panel.tsx';

export const CART_UPDATED_EVENT = 'cera:cart-updated';

function refreshCart(setCart: Dispatch<SetStateAction<Cart>>, onDone?: () => void): void {
  void fetchCart()
    .then((next) => {
      setCart((previous) => mergeCartState(previous, next));
    })
    .catch(() => undefined)
    .finally(() => onDone?.());
}

export function SiteHeaderCartMenu({ className }: { readonly className?: string }) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<Cart>(emptyCart());
  const [refreshing, setRefreshing] = useState(false);
  const count = cartItemCount(cart);

  useEffect(() => {
    refreshCart(setCart);
    const onUpdate = (event: Event) => {
      if (event instanceof CustomEvent) {
        setCart(event.detail as Cart);
      }
    };
    window.addEventListener(CART_UPDATED_EVENT, onUpdate);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpdate);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  const toggleOpen = () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setRefreshing(true);
    refreshCart(setCart, () => setRefreshing(false));
  };

  const showEmptyWhileLoading = refreshing && cart.lines.length === 0;

  const cartLabel = count > 0 ? `Cart, ${String(count)} items` : 'Cart';

  const countBadge =
    count > 0 ? (
      <span
        className="absolute -top-0.5 -right-0.5 flex size-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-accent px-1 text-[11px] font-bold leading-none text-on-accent shadow-sm"
        aria-hidden
      >
        {count > 9 ? '9+' : count}
      </span>
    ) : null;

  const iconButtonClass =
    'relative inline-flex size-11 items-center justify-center rounded-md text-neutral-700 transition-colors duration-base ease-standard hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {/*
       * Below `lg`, a popover anchored to the cart icon spans most of the viewport and covers the
       * wordmark. A dedicated cart page is easier to use on a phone and avoids overlapping the hero.
       */}
      <NextLink href="/cart" aria-label={cartLabel} className={cn(iconButtonClass, 'lg:hidden')}>
        <Icon icon={ShoppingCart} size="md" />
        {countBadge}
      </NextLink>
      <button
        type="button"
        className={cn(iconButtonClass, 'hidden lg:inline-flex')}
        aria-label={cartLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggleOpen}
      >
        <Icon icon={ShoppingCart} size="md" />
        {countBadge}
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Cart preview"
          className="absolute top-full right-0 z-50 mt-2 hidden w-[min(100vw-2rem,22rem)] rounded-lg border border-border bg-surface p-4 shadow-card lg:block"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <Text size="body-sm" className="font-semibold text-copy">
              Your cart
            </Text>
            {refreshing && cart.lines.length > 0 ? (
              <Text size="caption" tone="muted">
                Updating…
              </Text>
            ) : null}
          </div>
          {showEmptyWhileLoading ? (
            <Text size="body-sm" tone="muted">
              Loading…
            </Text>
          ) : (
            <CartMiniPanel cart={cart} onCheckout={() => setOpen(false)} />
          )}
        </div>
      ) : null}
    </div>
  );
}
