import {
  CartSchema,
  SafepayCheckoutStartResponseSchema,
  type Cart,
  type DeliveryAddress,
} from '@cera/contracts';

function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';
}

export type CheckoutPaymentMethod = 'cod' | 'safepay' | 'test';

export function cartItemCount(cart: Cart): number {
  return cart.lines.reduce((total, line) => total + line.quantity, 0);
}

const EMPTY_CART: Cart = {
  currencyCode: 'PKR',
  lines: [],
  subtotalMinor: 0,
  totalMinor: 0,
};

/** A fresh cart response is authoritative, including when the cart is empty. */
export function mergeCartState(_previous: Cart, next: Cart): Cart {
  return next;
}

/** Public catalogue prices and checkout are denominated in PKR. */
export function isCheckoutCurrency(cart: Cart): boolean {
  return cart.currencyCode === 'PKR';
}

export function emptyCart(): Cart {
  return EMPTY_CART;
}

export function notifyCartUpdated(cart?: Cart): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cera:cart-updated', { detail: cart }));
  }
}

export async function fetchCart(cookieHeader?: string | null): Promise<Cart> {
  const init: RequestInit = { credentials: 'include' };
  if (cookieHeader) init.headers = { cookie: cookieHeader };
  const response = await fetch(`${apiUrl()}/v1/cart`, init);
  if (!response.ok) throw new Error('cart_unavailable');
  return CartSchema.parse(await response.json());
}

export async function addCartLine(slug: string, quantity = 1): Promise<Cart> {
  const response = await fetch(`${apiUrl()}/v1/cart/lines`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug, quantity }),
  });
  if (!response.ok) throw new Error('add_failed');
  return CartSchema.parse(await response.json());
}

/** Confirm the new line survives a fresh read before reporting that it was added. */
export async function addVerifiedCartLine(slug: string, quantity = 1): Promise<Cart> {
  const added = await addCartLine(slug, quantity);
  if (!isCheckoutCurrency(added)) throw new Error('cart_currency_mismatch');
  const persisted = await fetchCart();
  if (!isCheckoutCurrency(persisted)) throw new Error('cart_currency_mismatch');
  const addedQuantity = added.lines
    .filter((line) => line.slug === slug)
    .reduce((total, line) => total + line.quantity, 0);
  const persistedQuantity = persisted.lines
    .filter((line) => line.slug === slug)
    .reduce((total, line) => total + line.quantity, 0);
  if (persistedQuantity < addedQuantity) {
    throw new Error('cart_not_saved');
  }
  return persisted;
}

export async function completeCheckout(body: {
  email: string;
  fullName: string;
  countryCode?: string;
  paymentMethod: CheckoutPaymentMethod;
  deliveryAddress: DeliveryAddress;
  billingAddress?: DeliveryAddress;
  safepayTracker?: string;
}): Promise<{ orderCode: string }> {
  const response = await fetch('/api/checkout/complete', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('checkout_failed');
  return (await response.json()) as { orderCode: string };
}

export async function startSafepayCheckout(body: {
  email: string;
  fullName: string;
  redirectUrl: string;
  cancelUrl: string;
  deliveryAddress: DeliveryAddress;
}): Promise<{ checkoutUrl: string; tracker: string }> {
  const response = await fetch('/api/checkout/safepay/start', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('safepay_start_failed');
  return SafepayCheckoutStartResponseSchema.parse(await response.json());
}

export const CHECKOUT_CONTACT_STORAGE_KEY = 'cera_checkout_contact';
