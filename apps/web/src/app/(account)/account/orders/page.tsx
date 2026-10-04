import { EmptyState } from '@cera/ui/empty-state';
import { Text } from '@cera/ui/typography';
import { ArrowRight, Package, ShoppingBag } from 'lucide-react';
import { notFound } from 'next/navigation';

import type { CustomerOrder } from '@cera/contracts';

import { AppLink, AppButtonLink } from '../../../../components/link.tsx';
import { PageHeader } from '../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../lib/auth/api.ts';
import { checkoutEnabled } from '../../../../lib/checkout-enabled.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Your orders' };

function formatMoney(minor: number, currency: string): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default async function AccountOrdersPage() {
  if (!checkoutEnabled()) notFound();

  const { items } = await authenticatedApi<{ items: CustomerOrder[] }>('/v1/me/orders', {
    returnTo: '/account/orders',
  });

  return (
    <>
      <PageHeader
        title="Your orders"
        lede="Checkout orders placed with this verified email address."
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {items.length === 0 ? (
          <EmptyState
            heading="No orders yet"
            headingLevel={2}
            description="When you complete checkout on the site, your order history appears here."
            action={
              <AppButtonLink
                href="/services"
                variant="primary"
                iconStart={<ShoppingBag aria-hidden />}
              >
                Browse services
              </AppButtonLink>
            }
          />
        ) : (
          <div>
            <Text tone="muted">
              {items.length} {items.length === 1 ? 'order' : 'orders'} on this account.
            </Text>
            <ul className="mt-8 grid list-none gap-4 p-0">
              {items.map((order) => (
                <li key={order.orderCode}>
                  <AppLink
                    href={`/account/orders/${encodeURIComponent(order.orderCode)}`}
                    className="group block rounded-lg border border-border bg-surface p-6 no-underline transition-shadow hover:shadow-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <Package aria-hidden className="mt-1 size-5 shrink-0 text-accent" />
                        <div>
                          <Text size="caption" tone="muted">
                            Order {order.orderCode}
                          </Text>
                          <Text className="mt-1 font-semibold text-copy">
                            {formatMoney(order.totalMinor, order.currencyCode)}
                          </Text>
                          <Text size="body-sm" tone="muted" className="mt-1">
                            {order.paymentLabel} · {order.lines.length}{' '}
                            {order.lines.length === 1 ? 'line' : 'lines'}
                          </Text>
                        </div>
                      </div>
                      <ArrowRight
                        aria-hidden
                        className="size-5 text-primary transition-transform group-hover:translate-x-1"
                      />
                    </div>
                  </AppLink>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
