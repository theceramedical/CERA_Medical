'use client';

import { Button } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { useState } from 'react';

import { addVerifiedCartLine, notifyCartUpdated } from '../../lib/cart-client.ts';
import { LabMouseIcon } from '../icons/lab-mouse-icon.tsx';
import { AppButtonLink } from '../link.tsx';

export function ProductPurchaseActions({
  sku,
  enquiryHref,
  checkoutAvailable,
  compact = false,
  label = 'Enquire',
}: {
  readonly sku: string;
  readonly enquiryHref: string;
  readonly checkoutAvailable: boolean;
  readonly compact?: boolean;
  readonly label?: string;
}) {
  const [quantity, setQuantity] = useState('1');
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!checkoutAvailable) {
    return (
      <AppButtonLink
        href={enquiryHref}
        variant="primary"
        size={compact ? 'sm' : 'md'}
        iconStart={
          <LabMouseIcon size={14} className="transition-transform group-hover:scale-110" />
        }
      >
        {label}
      </AppButtonLink>
    );
  }

  return (
    <form
      className={
        compact
          ? 'flex flex-col items-stretch gap-2 sm:flex-row sm:items-center'
          : 'flex flex-wrap items-end gap-3'
      }
      onSubmit={(event) => {
        event.preventDefault();
        const selectedQuantity = Number(quantity);
        if (!Number.isInteger(selectedQuantity) || selectedQuantity < 1 || selectedQuantity > 99) {
          setAdded(false);
          setError('Choose a quantity from 1 to 99.');
          return;
        }

        setPending(true);
        setAdded(false);
        setError(null);
        void addVerifiedCartLine(sku, selectedQuantity)
          .then((cart) => {
            notifyCartUpdated(cart);
            setAdded(true);
          })
          .catch((reason: unknown) => {
            const code = reason instanceof Error ? reason.message : '';
            const messages: Record<string, string> = {
              cart_currency_mismatch:
                'This cart has a currency mismatch. Please contact us before ordering.',
              cart_quantity_limit_exceeded:
                'Your cart has reached the maximum quantity of 99 for this product.',
              product_unavailable:
                'This product is no longer available for online ordering. Please enquire with our team.',
            };
            setError(messages[code] ?? 'Cart could not be saved. Please try again.');
          })
          .finally(() => setPending(false));
      }}
    >
      <label className="flex flex-col gap-1 text-caption font-semibold text-heading">
        Quantity
        <input
          aria-label={`Quantity for ${sku}`}
          name="quantity"
          type="number"
          min={1}
          max={99}
          step={1}
          required
          value={quantity}
          disabled={pending}
          onChange={(event) => {
            setQuantity(event.currentTarget.value);
            setAdded(false);
            setError(null);
          }}
          className="h-10 w-20 rounded-md border border-border bg-surface px-2 text-body-sm font-normal focus:border-primary focus:outline-none"
        />
      </label>
      <div className="flex min-w-0 flex-col gap-1">
        <Button type="submit" variant="primary" size={compact ? 'sm' : 'md'} disabled={pending}>
          {pending ? 'Adding…' : added ? 'Added to cart' : 'Add to cart'}
        </Button>
        {added ? (
          <Text size="caption" className="text-accent-700" role="status">
            Added to cart.
          </Text>
        ) : null}
        {error !== null ? (
          <Text size="caption" className="text-danger-600" role="alert">
            {error}
          </Text>
        ) : null}
      </div>
    </form>
  );
}
