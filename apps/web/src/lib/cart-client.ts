import { CartSchema, type Cart, type DeliveryAddress } from '@cera/contracts';

function cartUrl(path: string): string {
  const origin =
    typeof window === 'undefined'
      ? (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
      : window.location.origin;
  return new URL(path, origin).toString();
}

export type CheckoutPaymentMethod = 'cod';

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
  const response = await fetch(cartUrl('/v1/cart'), init);
  if (!response.ok) throw new Error('cart_unavailable');
  return CartSchema.parse(await response.json());
}

export async function addCartLine(slug: string, quantity = 1): Promise<Cart> {
  const response = await fetch(cartUrl('/v1/cart/lines'), {
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

export async function updateCartLine(lineId: string, quantity: number): Promise<Cart> {
  const response = await fetch(cartUrl(`/v1/cart/lines/${encodeURIComponent(lineId)}`), {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) throw new Error('update_failed');
  const updated = CartSchema.parse(await response.json());
  const persisted = await fetchCart();
  const updatedQuantity = updated.lines.find((line) => line.id === lineId)?.quantity ?? 0;
  const persistedQuantity = persisted.lines.find((line) => line.id === lineId)?.quantity ?? 0;
  if (persistedQuantity !== updatedQuantity) throw new Error('cart_not_saved');
  if (updated.lines.length !== persisted.lines.length) throw new Error('cart_not_saved');
  return persisted;
}

export async function completeCheckout(body: {
  email: string;
  fullName: string;
  countryCode?: string;
  paymentMethod: CheckoutPaymentMethod;
  deliveryAddress: DeliveryAddress;
  billingAddress?: DeliveryAddress;
}): Promise<{ orderCode: string }> {
  const response = await fetch(cartUrl('/api/checkout/complete'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('checkout_failed');
  return (await response.json()) as { orderCode: string };
}
