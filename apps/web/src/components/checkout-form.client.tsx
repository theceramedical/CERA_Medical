'use client';

import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { DeliveryAddress } from '@cera/contracts';

import { completeCheckout, type CheckoutPaymentMethod } from '../lib/cart-client.ts';

import { AppLink } from './link.tsx';

export function CheckoutForm({ cartTotalLabel }: { readonly cartTotalLabel: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const paymentMethod: CheckoutPaymentMethod = 'cod';

  return (
    <form
      className="mx-auto max-w-md space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const form = event.currentTarget;
        const data = new FormData(form);
        const nameRaw = data.get('fullName');
        const field = (name: string) => {
          const value = data.get(name);
          return typeof value === 'string' ? value.trim() : '';
        };
        if (typeof nameRaw !== 'string' || nameRaw.trim().length === 0) {
          setError('Enter your full name.');
          setPending(false);
          return;
        }
        const email = field('email');
        const fullName = nameRaw.trim();
        const deliveryAddress: DeliveryAddress = {
          streetLine1: field('streetLine1'),
          ...(field('streetLine2') ? { streetLine2: field('streetLine2') } : {}),
          city: field('city'),
          province: field('province'),
          postalCode: field('postalCode'),
          phoneNumber: field('phoneNumber'),
        };
        void completeCheckout({
          email,
          fullName,
          countryCode: 'PK',
          paymentMethod,
          deliveryAddress,
        })
          .then((result) =>
            router.push(`/checkout/confirmation?order=${encodeURIComponent(result.orderCode)}`),
          )
          .catch(() => {
            setError('Order could not be completed. Try again or contact us.');
            setPending(false);
          });
      }}
    >
      <Text tone="muted">Order total: {cartTotalLabel}</Text>
      <fieldset className="space-y-2">
        <Text size="body-sm" className="font-medium">
          Payment method
        </Text>
        <label className="flex items-center gap-2">
          <input type="radio" name="paymentMethod" value="cod" checked readOnly />
          <Text size="body-sm">Cash on delivery</Text>
        </label>
      </fieldset>
      <label className="block">
        <Text size="body-sm" className="mb-1 font-medium">
          Full name
        </Text>
        <input
          name="fullName"
          required
          className="w-full rounded-md border border-border bg-surface px-3 py-2"
        />
      </label>
      <label className="block">
        <Text size="body-sm" className="mb-1 font-medium">
          Email address
        </Text>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-border bg-surface px-3 py-2"
        />
      </label>
      <fieldset className="space-y-4 border-t border-border pt-5">
        <legend className="text-lg font-semibold">Delivery details</legend>
        <Text size="body-sm" tone="muted">
          Enter the address where this order should be delivered.
        </Text>
        {[
          { name: 'phoneNumber', label: 'Phone number', autoComplete: 'tel', required: true },
          {
            name: 'streetLine1',
            label: 'Street address',
            autoComplete: 'address-line1',
            required: true,
          },
          {
            name: 'streetLine2',
            label: 'Apartment, suite or building (optional)',
            autoComplete: 'address-line2',
            required: false,
          },
          { name: 'city', label: 'City', autoComplete: 'address-level2', required: true },
          {
            name: 'province',
            label: 'Province or region',
            autoComplete: 'address-level1',
            required: true,
          },
          { name: 'postalCode', label: 'Postal code', autoComplete: 'postal-code', required: true },
        ].map((field) => (
          <label key={field.name} className="block">
            <Text size="body-sm" className="mb-1 font-medium">
              {field.label}
            </Text>
            <input
              name={field.name}
              autoComplete={field.autoComplete}
              required={field.required}
              className="w-full rounded-md border border-border bg-surface px-3 py-2"
            />
          </label>
        ))}
      </fieldset>
      {error ? (
        <Text size="body-sm" className="text-danger-600">
          {error}
        </Text>
      ) : null}
      <Button type="submit" variant="primary" disabled={pending} className="w-full justify-center">
        {pending ? 'Processing…' : 'Confirm order'}
      </Button>
      <Text size="body-sm" tone="muted">
        Cash on delivery is the only available payment method.{' '}
        <AppLink href="/contact">Need help?</AppLink>
      </Text>
    </form>
  );
}
