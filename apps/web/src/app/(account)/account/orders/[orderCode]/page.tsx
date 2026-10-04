import { Text } from '@cera/ui/typography';
import { notFound } from 'next/navigation';

import type { CustomerOrder } from '@cera/contracts';

import { AppLink } from '../../../../../components/link.tsx';
import { PageHeader } from '../../../../../components/page-header.tsx';
import { authenticatedApi } from '../../../../../lib/auth/api.ts';
import { checkoutEnabled } from '../../../../../lib/checkout-enabled.ts';

import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Order detail' };

function formatMoney(minor: number, currency: string): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export default async function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ orderCode: string }>;
}) {
  if (!checkoutEnabled()) notFound();

  const { orderCode } = await params;
  let order: CustomerOrder;
  try {
    order = await authenticatedApi<CustomerOrder>(
      `/v1/me/orders/${encodeURIComponent(orderCode)}`,
      { returnTo: `/account/orders/${encodeURIComponent(orderCode)}` },
    );
  } catch {
    notFound();
  }

  return (
    <>
      <PageHeader title={`Order ${order.orderCode}`} lede={order.paymentLabel} />
      <div className="mx-auto max-w-site space-y-6 px-6 py-12 md:px-10">
        <Text>
          Placed: {new Date(order.placedAt).toLocaleString('en-GB', { dateStyle: 'medium' })}
        </Text>
        <Text className="font-semibold">
          Total: {formatMoney(order.totalMinor, order.currencyCode)}
        </Text>
        <div>
          <Text className="mb-2 font-medium">Items</Text>
          <ul className="list-disc space-y-2 pl-5">
            {order.lines.map((line) => (
              <li key={`${line.slug}-${line.title}`}>
                <Text>
                  {line.title} × {line.quantity} —{' '}
                  {formatMoney(line.lineTotalMinor, order.currencyCode)}
                </Text>
              </li>
            ))}
          </ul>
        </div>
        <Text size="body-sm" tone="muted">
          Operations also receive this order in ERPNext (CRM) for fulfilment. For changes,{' '}
          <AppLink href="/contact">contact us</AppLink> and quote order {order.orderCode}.
        </Text>
        <AppLink href="/account/orders">← All orders</AppLink>
      </div>
    </>
  );
}
