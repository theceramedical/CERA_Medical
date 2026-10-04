import { ButtonLink } from '@cera/ui/button';
import { Heading, Text } from '@cera/ui/typography';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { AppLink } from '../../../components/link.tsx';
import { MarketingPageHeader } from '../../../components/marketing-page-header.tsx';
import { fetchCart } from '../../../lib/cart-client.ts';
import { checkoutEnabled } from '../../../lib/checkout-enabled.ts';
import { pageMetadata } from '../../../lib/seo.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = pageMetadata({
  title: 'Cart',
  description: 'Review physical products and research services before checkout.',
  path: '/cart',
  noIndex: true,
});

export default async function CartPage() {
  if (!checkoutEnabled()) notFound();

  let cart;
  try {
    cart = await fetchCart((await headers()).get('cookie'));
  } catch {
    cart = { currencyCode: 'PKR', lines: [], subtotalMinor: 0, totalMinor: 0 };
  }

  return (
    <>
      <MarketingPageHeader
        title="Your cart"
        lede="Physical products and fixed-price service lines. Sign in after checkout to track orders at Account → Orders."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: 'Cart' },
        ]}
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {cart.lines.length === 0 ? (
          <Text tone="muted">
            Your cart is empty. <AppLink href="/products">Browse products</AppLink> or{' '}
            <AppLink href="/services">research services</AppLink>.
          </Text>
        ) : (
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
                    {(line.lineTotalMinor / 100).toFixed(2)} {cart.currencyCode}
                  </Text>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Heading level={2} size="h4">
                Total{' '}
                <span className="font-mono">
                  {(cart.totalMinor / 100).toFixed(2)} {cart.currencyCode}
                </span>
              </Heading>
              <ButtonLink href="/checkout" as={AppLink} variant="primary">
                Proceed to checkout
              </ButtonLink>
            </div>
          </>
        )}
      </div>
    </>
  );
}
