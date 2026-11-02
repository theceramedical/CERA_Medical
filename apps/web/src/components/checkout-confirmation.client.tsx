'use client';

import { Heading, Text } from '@cera/ui/typography';
import { useEffect, useState } from 'react';

import { AppLink } from './link.tsx';

type ConfirmationState =
  | { readonly status: 'checking' }
  | { readonly status: 'confirmed'; readonly orderCode: string }
  | { readonly status: 'unverified' };

export function CheckoutConfirmation({ orderCode }: { readonly orderCode: string }) {
  const [state, setState] = useState<ConfirmationState>({ status: 'checking' });

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ order: orderCode });
    void fetch(`/api/checkout/confirmation?${query}`, {
      credentials: 'include',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('confirmation_unavailable');
        const body: unknown = await response.json();
        if (
          body === null ||
          typeof body !== 'object' ||
          !('orderCode' in body) ||
          body.orderCode !== orderCode
        ) {
          throw new Error('confirmation_unavailable');
        }
        setState({ status: 'confirmed', orderCode: body.orderCode });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'unverified' });
      });

    return () => controller.abort();
  }, [orderCode]);

  if (state.status === 'checking') {
    return (
      <Text role="status" aria-live="polite">
        Verifying your order…
      </Text>
    );
  }

  if (state.status === 'unverified') {
    return (
      <div>
        <Heading level={1} size="h2">
          Order not verified
        </Heading>
        <Text role="alert" className="mt-4">
          We could not verify this order from your current cart. Check that you are using the same
          browser and contact our team if you need help.
        </Text>
        <Text className="mt-6">
          <AppLink href="/contact" className="underline underline-offset-4">
            Contact our team
          </AppLink>
        </Text>
      </div>
    );
  }

  return (
    <div>
      <Heading level={1} size="h2">
        Thank you
      </Heading>
      <Text className="mt-4">
        We received your cash-on-delivery order <strong>{state.orderCode}</strong>. Payment is due
        to the courier when your order arrives. No email confirmation has been sent.
      </Text>
      <Text className="mt-6">
        Questions about this order?{' '}
        <AppLink href="/contact" className="underline underline-offset-4">
          Contact our team
        </AppLink>
      </Text>
    </div>
  );
}
