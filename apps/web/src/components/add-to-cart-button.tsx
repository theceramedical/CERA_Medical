'use client';

import { Button } from '@cera/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { addCartLine, notifyCartUpdated } from '../lib/cart-client.ts';

export function AddToCartButton({
  slug,
  label = 'Add to cart',
  redirectToCart = false,
}: {
  readonly slug: string;
  readonly label?: string;
  readonly redirectToCart?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      className="w-full justify-center"
      onClick={() => {
        setPending(true);
        setAdded(false);
        void addCartLine(slug, 1)
          .then(() => {
            notifyCartUpdated();
            setAdded(true);
            if (redirectToCart) router.push('/cart');
          })
          .catch(() => setPending(false))
          .finally(() => setPending(false));
      }}
    >
      {pending ? 'Adding…' : added && !redirectToCart ? 'Added' : label}
    </Button>
  );
}
