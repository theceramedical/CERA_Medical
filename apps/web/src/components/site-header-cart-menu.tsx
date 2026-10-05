'use client';

import { cn } from '@cera/ui/cn';
import { Icon } from '@cera/ui/icon';
import { Text } from '@cera/ui/typography';
import { ShoppingCart } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import type { Cart } from '@cera/contracts';

import { cartItemCount, fetchCart } from '../lib/cart-client.ts';

import { CartMiniPanel } from './cart-mini-panel.tsx';

export const CART_UPDATED_EVENT = 'cera:cart-updated';

const EMPTY_CART: Cart = {
  currencyCode: 'PKR',
  lines: [],
  subtotalMinor: 0,
  totalMinor: 0,
};

function loadCart(onLoaded: (cart: Cart) => void, onDone?: () => void): void {
  void fetchCart()
    .then(onLoaded)
    .catch(() => onLoaded(EMPTY_CART))
    .finally(() => onDone?.());
}

export function SiteHeaderCartMenu({ className }: { readonly className?: string }) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [loading, setLoading] = useState(false);
  const count = cartItemCount(cart);

  useEffect(() => {
    loadCart(setCart);
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
    setLoading(true);
    loadCart(setCart, () => setLoading(false));
  };

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        className="relative inline-flex size-11 items-center justify-center rounded-md text-neutral-700 transition-colors duration-base ease-standard hover:bg-surface-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        aria-label={count > 0 ? `Cart, ${String(count)} items` : 'Cart'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggleOpen}
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
      </button>
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="Cart preview"
          className="absolute top-full right-0 z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-lg border border-border bg-surface p-4 shadow-card"
        >
          <Text size="body-sm" className="mb-3 font-semibold text-copy">
            Your cart
          </Text>
          {loading && cart.lines.length === 0 ? (
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
