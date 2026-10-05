import { CartSchema, SafepayCheckoutStartResponseSchema, type Cart } from '@cera/contracts';

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

/** Prefer server cart when it has lines; keep local optimistic cart if the API is briefly empty. */
export function mergeCartState(previous: Cart, next: Cart): Cart {
  if (next.lines.length > 0) return next;
  if (previous.lines.length > 0) return previous;
  return next;
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

export async function completeCheckout(body: {
  email: string;
  fullName: string;
  countryCode?: string;
  paymentMethod: CheckoutPaymentMethod;
  safepayTracker?: string;
}): Promise<{ orderCode: string }> {
  const response = await fetch(`${apiUrl()}/v1/checkout/complete`, {
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
}): Promise<{ checkoutUrl: string; tracker: string }> {
  const response = await fetch(`${apiUrl()}/v1/checkout/safepay/start`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('safepay_start_failed');
  return SafepayCheckoutStartResponseSchema.parse(await response.json());
}

export const CHECKOUT_CONTACT_STORAGE_KEY = 'cera_checkout_contact';
