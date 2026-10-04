import { ButtonLink } from '@cera/ui/button';
import { Text } from '@cera/ui/typography';
import { notFound } from 'next/navigation';

import { AppLink } from '../../../../components/link.tsx';
import { MarketingPageHeader } from '../../../../components/marketing-page-header.tsx';
import { ProductPurchaseActions } from '../../../../components/products/product-purchase-actions.tsx';
import {
  FEATURED_PRODUCT,
  findCatalogEntry,
  listCatalogSlugs,
  productDetailPath,
  productEnquiryHref,
} from '../../../../content/products-catalog.ts';
import { checkoutEnabled } from '../../../../lib/checkout-enabled.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export function generateStaticParams(): { sku: string }[] {
  return listCatalogSlugs().map((sku) => ({ sku }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ sku: string }>;
}): Promise<Metadata> {
  const { sku } = await params;
  const entry = findCatalogEntry(sku);
  if (entry === null) {
    return pageMetadata({
      title: 'Product not found',
      description: 'This catalogue SKU is not listed.',
      path: productDetailPath(sku),
      noIndex: true,
    });
  }
  const title = entry.kind === 'featured' ? entry.title : entry.product.title;
  const description = entry.kind === 'featured' ? entry.description : entry.product.description;
  return pageMetadata({
    title,
    description,
    path: productDetailPath(sku),
  });
}

export default async function ProductDetailPage({
  params,
}: {
  readonly params: Promise<{ sku: string }>;
}) {
  const { sku } = await params;
  const entry = findCatalogEntry(sku);
  if (entry === null) notFound();

  if (entry.kind === 'featured') {
    return (
      <>
        <MarketingPageHeader
          title={entry.title}
          lede={entry.description}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: entry.title },
          ]}
        />
        <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
          <Text size="caption" tone="muted" className="font-mono">
            Cat #{entry.sku}
          </Text>
          <Text size="body-sm" className="mt-2 font-semibold">
            {FEATURED_PRODUCT.price} {FEATURED_PRODUCT.priceNote}
          </Text>
          <ul className="mt-6 list-disc space-y-1 pl-5">
            {FEATURED_PRODUCT.specs.map((spec) => (
              <li key={spec.label}>
                <Text size="body-sm">
                  {spec.label}: {spec.value}
                </Text>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            {checkoutEnabled() ? (
              <ProductPurchaseActions sku={entry.sku} enquiryHref={productEnquiryHref(entry.sku)} />
            ) : (
              <ButtonLink href={productEnquiryHref(entry.sku)} as={AppLink} variant="primary">
                Request quote
              </ButtonLink>
            )}
            <ButtonLink href="/products" as={AppLink} variant="outline">
              Back to catalogue
            </ButtonLink>
          </div>
        </div>
      </>
    );
  }

  const { product } = entry;
  return (
    <>
      <MarketingPageHeader
        title={product.title}
        lede={product.description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: product.title },
        ]}
      />
      <div className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <Text size="caption" tone="muted" className="font-mono">
          Cat #{product.sku}
        </Text>
        <Text size="body-sm" tone="muted" className="mt-2">
          {product.packLabel} · {product.price}
        </Text>
        <ul className="mt-6 list-disc space-y-1 pl-5">
          {product.specs.map((spec) => (
            <li key={spec}>
              <Text size="body-sm">{spec}</Text>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          {checkoutEnabled() ? (
            <ProductPurchaseActions
              sku={product.sku}
              enquiryHref={productEnquiryHref(product.sku)}
              compact
            />
          ) : (
            <ButtonLink href={productEnquiryHref(product.sku)} as={AppLink} variant="primary">
              Request quote
            </ButtonLink>
          )}
          <ButtonLink href="/products" as={AppLink} variant="outline">
            Back to catalogue
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
