'use client';

import { Button } from '@cera/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { addCartLine } from '../lib/cart-client.ts';

export function AddToCartButton({
  slug,
  label = 'Add to cart',
}: {
  readonly slug: string;
  readonly label?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      className="w-full justify-center"
      onClick={() => {
        setPending(true);
        void addCartLine(slug, 1)
          .then(() => router.push('/cart'))
          .catch(() => setPending(false));
      }}
    >
      {pending ? 'Adding…' : label}
    </Button>
  );
}
