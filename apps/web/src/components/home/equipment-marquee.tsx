import { Heading, Text } from '@cera/ui/typography';

import type { PublicProduct } from '@cera/contracts/projections';

import { catalogueProducts, productMediaFor } from '../../content/catalogue-products.ts';
import { productDetailPath } from '../../content/products-catalog.ts';
import { AppLink } from '../link.tsx';

import { ProductCarousel } from './product-carousel.client.tsx';

export function EquipmentMarquee({
  products = [],
}: {
  readonly products?: readonly PublicProduct[];
}) {
  const slides = (products.length > 0 ? products : catalogueProducts()).map((product) => {
    const media = productMediaFor(product.sku);
    return {
      sku: product.sku,
      title: product.title,
      summary: product.summary,
      price: product.displayPrice,
      href: productDetailPath(product.sku),
      imageUrl: product.imageUrl ?? media?.imageSrc ?? null,
      imageAlt: media?.imageAlt ?? product.title,
      videoUrl: media?.videoSrc ?? null,
    };
  });

  return (
    <section
      aria-labelledby="products-heading"
      className="cera-view overflow-hidden border-b border-border bg-surface-tint py-12"
    >
      <div className="mx-auto mb-6 flex max-w-site flex-col justify-between gap-4 px-6 md:flex-row md:items-end md:px-10">
        <div>
          <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
          <Heading level={2} size="h2" id="products-heading" className="mb-2">
            Products
          </Heading>
          <Text tone="muted" className="max-w-2xl">
            Research-use reagents, kits and cell preparations from the CERA catalogue.
          </Text>
        </div>
        <AppLink href="/products" className="font-semibold text-accent no-underline">
          View all products
        </AppLink>
      </div>
      <ProductCarousel products={slides} />
    </section>
  );
}
