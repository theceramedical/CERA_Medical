import { Heading, Text } from '@cera/ui/typography';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  FlaskConical,
  Leaf,
  Package,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { notFound } from 'next/navigation';

import { LabMouseIcon } from '../../../../components/icons/lab-mouse-icon.tsx';
import { AppButtonLink, AppLink } from '../../../../components/link.tsx';
import { MarketingPageHeader } from '../../../../components/marketing-page-header.tsx';
import { ProductPurchaseActions } from '../../../../components/products/product-purchase-actions.tsx';
import {
  catalogueProducts,
  getVerifiedPortfolioProductBySku,
  productMediaFor,
} from '../../../../content/catalogue-products.ts';
import {
  productDetailPath,
  productEnquiryHref,
  type CatalogProduct,
} from '../../../../content/products-catalog.ts';
import { listPublicProducts } from '../../../../lib/catalogue/client.ts';
import { resolveProductDetail } from '../../../../lib/resolve-product-detail.ts';
import { pageMetadata } from '../../../../lib/seo.ts';

import type { Metadata } from 'next';

export const dynamicParams = true;

export async function generateStaticParams(): Promise<{ sku: string }[]> {
  const { items } = await listPublicProducts().catch(() => ({ items: [] }));
  const staticProducts = catalogueProducts();
  const allSkus = [
    ...new Set([
      ...items.map((r) => r.sku.toLowerCase()),
      ...staticProducts.map((p) => p.sku.toLowerCase()),
    ]),
  ];
  return allSkus.map((sku) => ({ sku }));
}

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ sku: string }>;
}): Promise<Metadata> {
  const { sku } = await params;
  const entry = await resolveProductDetail(sku);
  const portfolioItem = getVerifiedPortfolioProductBySku(sku);

  if (entry === null && portfolioItem === null) {
    return pageMetadata({
      title: 'Product not found',
      description: 'This catalogue SKU is not listed.',
      path: productDetailPath(sku),
      noIndex: true,
    });
  }

  const title = portfolioItem?.title ?? entry?.product.title ?? sku;
  const description =
    portfolioItem?.description ??
    entry?.product.summary ??
    entry?.product.description ??
    'CERA Medical research product.';

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
  const entry = await resolveProductDetail(sku);
  const portfolioItem = getVerifiedPortfolioProductBySku(sku);

  if (entry === null && portfolioItem === null) {
    notFound();
  }

  const product = entry?.product;
  const item: Partial<CatalogProduct> = portfolioItem ?? {};

  const title = item.title ?? product?.title ?? sku;
  const description = item.description ?? product?.summary ?? product?.description ?? '';
  const price = item.price ?? product?.displayPrice ?? 'Price on enquiry';
  const packLabel = item.packLabel ?? '';
  const specs = item.specs ?? (product?.availabilityText ? [product.availabilityText] : []);
  const ingredients = item.ingredients ?? [];
  const keyBenefits = item.keyBenefits ?? [];
  const directions = item.directions ?? '';
  const isMouseModel = item.isMouseModel ?? false;
  const categoryLabel = item.categoryLabel ?? 'Biomedical Catalogue';

  const media = productMediaFor(sku);
  const imageSrc = item.imageUrl ?? product?.imageUrl ?? media?.imageSrc;

  return (
    <>
      <MarketingPageHeader
        title={title}
        lede={description}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          { label: title },
        ]}
      />

      <main className="mx-auto max-w-site px-6 py-12 md:px-10 lg:py-16">
        <div className="mb-6">
          <AppLink
            href="/products"
            className="inline-flex items-center gap-2 text-caption font-semibold text-primary no-underline hover:underline"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Back to full catalogue
          </AppLink>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left Column: Product Media & Core Specs */}
          <div className="flex flex-col gap-8">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-8">
              {/* Category banner */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-50 px-3 py-1 text-caption font-bold text-primary">
                  {categoryLabel}
                </span>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-caption text-muted">
                    SKU: {sku.toUpperCase()}
                  </span>
                  {isMouseModel ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-50 px-2.5 py-0.5 text-caption font-semibold text-primary">
                      <LabMouseIcon size={13} />
                      In Vivo Rodent
                    </span>
                  ) : null}
                </div>
              </div>

              {media?.videoSrc !== undefined ? (
                <video
                  src={media.videoSrc}
                  poster={imageSrc}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full rounded-xl border border-border bg-surface-subtle object-cover shadow-2xs"
                >
                  <track kind="captions" />
                </video>
              ) : imageSrc !== undefined ? (
                <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border border-border bg-surface-subtle">
                  <img
                    src={imageSrc}
                    alt={media?.imageAlt ?? title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex aspect-[16/10] w-full flex-col items-center justify-center rounded-xl border border-dashed border-primary/25 bg-surface-subtle p-8 text-center">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-primary-50 text-primary">
                    {isMouseModel ? <LabMouseIcon size={32} /> : <FlaskConical size={32} />}
                  </div>
                  <div className="mt-3 font-semibold text-heading">{title}</div>
                  <div className="mt-1 text-caption text-muted">
                    {categoryLabel} • CERA Medical Haripur
                  </div>
                </div>
              )}

              {/* Price & Packaging Card */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-subtle p-5">
                <div>
                  <div className="text-eyebrow font-semibold tracking-wider text-muted uppercase">
                    Pricing & Packaging
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
                      {price}
                    </span>
                    {packLabel ? (
                      <span className="text-caption font-medium text-muted">/ {packLabel}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-surface px-3 py-1.5 shadow-2xs">
                  <span className="size-2 rounded-full bg-accent" />
                  <span className="text-caption font-semibold text-heading">
                    {item.inStock ? 'In Stock (Haripur Vivarium)' : 'Available for Scoping'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <ProductPurchaseActions
                  enquiryHref={productEnquiryHref(sku)}
                  label="Enquire / Order Product"
                />
                <AppButtonLink
                  href={`/contact?service=preclinical-studies&sku=${encodeURIComponent(sku)}#contact-form`}
                  variant="outline"
                  iconStart={
                    <LabMouseIcon
                      size={15}
                      className="transition-transform group-hover:scale-110"
                    />
                  }
                >
                  Consult Vivarium Team
                </AppButtonLink>
              </div>
            </div>

            {/* Quality & Ethical Accreditation Card */}
            <div className="rounded-2xl border border-border bg-surface-tint p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-surface text-primary shadow-xs">
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <div className="font-bold text-heading">Verified Bio-Enterprise Guarantee</div>
                  <div className="text-caption text-muted">
                    SECP-registered R&D facility with Institutional Animal Ethics Oversight
                  </div>
                </div>
              </div>
              <ul className="mt-4 grid gap-2 text-caption text-copy sm:grid-cols-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-accent" />
                  <span>GLP-compliant study documentation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-accent" />
                  <span>BSL-2 certified genomics & cell culture</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-accent" />
                  <span>SPF rodent barrier housing (Mus musculus)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-accent" />
                  <span>Batch Certificate of Analysis on request</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: In-Depth Specifications & Formulation */}
          <div className="flex flex-col gap-6">
            {/* Key Specifications Grid */}
            {specs.length > 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                <div className="flex items-center gap-2 text-eyebrow font-semibold tracking-wider text-accent uppercase">
                  <Sparkles size={16} />
                  Key Specifications & Highlights
                </div>
                <ul className="mt-4 grid gap-3 p-0">
                  {specs.map((spec) => (
                    <li
                      key={spec}
                      className="flex items-start gap-3 rounded-lg border border-border/60 bg-surface-subtle p-3"
                    >
                      <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-accent" />
                      <span className="text-body-sm font-medium text-copy">{spec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Active Ingredients & Botanical Extracts */}
            {ingredients.length > 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                <div className="flex items-center gap-2 text-eyebrow font-semibold tracking-wider text-accent uppercase">
                  <Leaf size={16} />
                  Active Botanical Extracts & Formulation
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-50 px-3.5 py-1 text-caption font-semibold text-primary"
                    >
                      <Leaf size={12} className="text-accent" />
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Key Indications & Benefits */}
            {keyBenefits.length > 0 ? (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                <div className="flex items-center gap-2 text-eyebrow font-semibold tracking-wider text-accent uppercase">
                  <Package size={16} />
                  Therapeutic Indications & Benefits
                </div>
                <ul className="mt-4 space-y-2.5 pl-2 text-body-sm text-copy">
                  {keyBenefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2.5">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Directions for Use & Protocol Guidance */}
            {directions ? (
              <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
                <div className="flex items-center gap-2 text-eyebrow font-semibold tracking-wider text-accent uppercase">
                  <FileText size={16} />
                  Directions & Protocol
                </div>
                <Text size="body-sm" className="mt-3 leading-relaxed text-copy">
                  {directions}
                </Text>
              </div>
            ) : null}

            {/* Research & Study Scoping Banner */}
            <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary-50 to-surface p-6 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-on-primary">
                  <LabMouseIcon size={14} />
                </span>
                <span className="text-caption font-bold text-primary uppercase">
                  Preclinical Animal Studies Callout
                </span>
              </div>
              <Heading level={3} size="h4" className="mt-3">
                Need customized animal model cohorts or bioassays?
              </Heading>
              <Text size="body-sm" tone="muted" className="mt-2">
                CERA’s vivarium team develops bespoke disease models (neurotoxicity, addiction,
                metabolic stress) to evaluate natural extracts and novel chemical entities.
              </Text>
              <div className="mt-4">
                <AppButtonLink
                  href="/services/preclinical-studies#in-vivo-studies"
                  variant="outline"
                  size="sm"
                  iconStart={<LabMouseIcon size={14} />}
                >
                  Explore In Vivo Capabilities
                </AppButtonLink>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
