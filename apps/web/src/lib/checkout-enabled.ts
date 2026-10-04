export function checkoutEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CHECKOUT_ENABLED === 'true';
}
