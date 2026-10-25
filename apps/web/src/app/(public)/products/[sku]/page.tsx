import { ButtonLink } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { notFound } from 'next/navigation';

import { AppLink } from '../../../../components/link.tsx';
import { MarketingPageHeader } from '../../../../components/marketing-page-header.tsx';
import { ProductPurchaseActions } from '../../../../components/products/product-purchase-actions.tsx';
import { catalogueProducts, productMediaFor } from '../../../../content/catalogue-products.ts';
import { productDetailPath, productEnquiryHref } from '../../../../content/products-catalog.ts';
import { HELD_PRODUCT_SKUS } from '../../../../content/public-revision.ts';
import { resolveProductDetail } from '../../../../lib/resolve-product-detail.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export const dynamicParams = true;

export function generateStaticParams(): { sku: string }[] {
  const held = new Set(HELD_PRODUCT_SKUS.map((sku) => sku.toLowerCase()));
  const skus = [...new Set(catalogueProducts().map((row) => row.sku.toLowerCase()))].filter(
    (sku) => !held.has(sku),
  );
  return skus.map((sku) => ({ sku }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ sku: string }>;
}): Promise<Metadata> {
  const { sku } = await params;
  const entry = await resolveProductDetail(sku);
  if (entry === null) {
    return pageMetadata({
      title: 'Product not found',
      description: 'This catalogue SKU is not listed.',
      path: productDetailPath(sku),
      noIndex: true,
    });
  }
  return pageMetadata({
    title: entry.product.title,
    description: entry.product.summary || entry.product.description,
    path: productDetailPath(sku),
  });
}

export default async function ProductDetailPage({
  params,
}: {
  readonly params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const entry = await resolveProductDetail(sku);
  if (entry === null) notFound();
  const { product } = entry;
  const media = productMediaFor(product.sku);
  const imageSrc = product.imageUrl ?? media?.imageSrc;
  return (
    <>
      <MarketingPageHeader
        title={product.title}
        lede={product.summary || product.description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: product.title },
        ]}
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        {media?.videoSrc !== undefined ? (
          <video
            src={media.videoSrc}
            poster={imageSrc}
            controls
            playsInline
            preload="metadata"
            className="mb-8 aspect-video w-full rounded-lg border border-border bg-surface object-cover shadow-card"
          >
            <track kind="captions" />
          </video>
        ) : imageSrc !== undefined ? (
          <img
            src={imageSrc}
            alt={media?.imageAlt ?? product.title}
            className="mb-8 aspect-video w-full rounded-lg border border-border object-cover shadow-card"
          />
        ) : null}
        <Text size="caption" tone="muted" className="font-mono">
          Cat #{product.sku}
        </Text>
        <Text size="body-sm" tone="muted" className="mt-2">
          {product.availabilityText ?? 'Availability must be confirmed before dispatch.'}
        </Text>
        <Text size="body-sm" className="mt-2 font-semibold">
          Price on enquiry
        </Text>
        <div className="mt-8 flex flex-wrap gap-3">
          <ProductPurchaseActions enquiryHref={productEnquiryHref(product.sku)} />
          <ButtonLink href="/products" as={AppLink} variant="outline">
            Back to catalogue
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
