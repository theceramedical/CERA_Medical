import { CartSchema, type Cart } from '@cera/contracts';

import { apiUrl } from './catalogue/client.ts';

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
  paymentIntentId?: string;
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
