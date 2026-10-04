import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import {
  CheckCircle2,
  FileText,
  LayoutList,
  ShieldCheck,
  Snowflake,
  Star,
  Fingerprint,
} from 'lucide-react';
import Image from 'next/image';

import {
  CATALOG_PRODUCT_COUNT,
  CATALOG_PRODUCTS,
  FEATURED_PRODUCT,
  PRODUCT_CATEGORIES,
  filterCatalog,
  productEnquiryHref,
  type ProductCategory,
} from '../../content/products-catalog.ts';
import { AppButtonLink, AppLink } from '../link.tsx';

import { ProductPurchaseActions } from './product-purchase-actions.tsx';

export function ProductsCatalog({
  query,
  category,
  bsl,
  inStockOnly,
}: {
  readonly query?: string;
  readonly category?: string;
  readonly bsl?: string;
  readonly inStockOnly?: boolean;
}) {
  const activeCategory = (category ?? 'all') as 'all' | ProductCategory;
  const filtered = filterCatalog(CATALOG_PRODUCTS, {
    ...(query === undefined ? {} : { q: query }),
    category: activeCategory,
    ...(bsl === undefined ? {} : { bsl }),
    ...(inStockOnly === true ? { inStock: true } : {}),
  });

  return (
    <div className="mx-auto max-w-site px-6 py-6 md:px-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-caption text-muted">
        <AppLink href="/">Home</AppLink>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-heading">Physical Products & Reagents</span>
      </nav>

      <section className="mb-8 rounded-lg border border-border bg-surface p-8 shadow-card">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent bg-surface-tint px-3 py-1 text-caption font-semibold text-accent">
              <Icon icon={ShieldCheck} size="sm" />
              SHIPPABLE LABORATORY PRODUCTS · RUO GRADE · NOT RESEARCH SERVICES
            </p>
            <Heading level={1} size="h1" className="mb-3">
              Physical Research Products & Laboratory Reagents
            </Heading>
            <Text size="body-lg" tone="muted" className="max-w-2xl">
              Catalogued, batch-released goods we ship to your lab: authenticated cell lines, assay
              kits, biochemical reagents, and reference standards. For scoped study work (sequencing
              runs, animal studies, evidence reviews), use{' '}
              <AppLink href="/services" className="font-semibold text-accent">
                Research Services
              </AppLink>
              .
            </Text>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
            <AppButtonLink href="#order-process" variant="primary">
              <Icon icon={FileText} size="sm" />
              Procurement & Order Protocol
            </AppButtonLink>
            <AppButtonLink href="#catalog-grid" variant="outline">
              <Icon icon={LayoutList} size="sm" />
              Browse Catalog Inventory ({CATALOG_PRODUCT_COUNT})
            </AppButtonLink>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-4">
          <Assurance
            icon={FileText}
            title="CoA with Every Batch"
            body="Batch-specific Certificates of Analysis and QC spectrometry logs included."
          />
          <Assurance
            icon={Fingerprint}
            title="Mycoplasma-Free STR"
            body="High-fidelity 16-locus STR profiling verified against international standards."
          />
          <Assurance
            icon={Snowflake}
            title="Cold Chain Dispatch"
            body="Continuous temperature logging with dry-ice & liquid nitrogen couriers."
          />
          <Assurance
            icon={ShieldCheck}
            title="GLP & ISO 15189"
            body="Stringent adherence to laboratory best practices and cleanroom isolation."
          />
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-border bg-surface p-5 shadow-card">
        <form method="get" className="mb-4 flex flex-col gap-4 md:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search products</span>
            <input
              name="q"
              defaultValue={query ?? ''}
              placeholder="Search by catalog number, SKU, cell line, kit, or reagent..."
              className="h-10 w-full rounded-md border border-border bg-surface px-3 text-body"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="product-bsl">
              Biosafety level
            </label>
            <select
              id="product-bsl"
              name="bsl"
              defaultValue={bsl ?? ''}
              className="h-10 rounded-md border border-border bg-surface px-3 text-caption"
            >
              <option value="">Biosafety: All Levels</option>
              <option value="1">BSL-1 (Non-pathogenic)</option>
              <option value="2">BSL-2 (Containment Req.)</option>
            </select>
            <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-subtle px-3">
              <input
                type="checkbox"
                name="inStock"
                value="1"
                defaultChecked={inStockOnly === true}
                className="size-4 rounded border-border"
              />
              <span className="text-caption font-semibold text-heading">In-Stock Only</span>
            </label>
            <button
              type="submit"
              className="h-10 rounded-md bg-primary-700 px-4 text-caption font-semibold text-on-primary"
            >
              Apply
            </button>
          </div>
          {activeCategory !== 'all' ? (
            <input type="hidden" name="category" value={activeCategory} />
          ) : null}
        </form>
        <div
          className="flex items-center gap-2 overflow-x-auto border-t border-border pt-3"
          role="tablist"
          aria-label="Product categories"
        >
          {PRODUCT_CATEGORIES.map((tab) => {
            const selected = tab.id === activeCategory;
            const href =
              tab.id === 'all'
                ? '/products'
                : `/products?category=${tab.id}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
            return (
              <AppLink
                key={tab.id}
                href={href}
                aria-current={selected ? 'page' : undefined}
                className={
                  selected
                    ? 'whitespace-nowrap rounded-md bg-primary-700 px-4 py-1.5 text-caption font-medium text-on-primary no-underline'
                    : 'whitespace-nowrap rounded-md bg-surface-tint px-4 py-1.5 text-caption font-medium text-muted no-underline hover:bg-surface-tint-2'
                }
              >
                {tab.label}
              </AppLink>
            );
          })}
        </div>
      </section>

      <section className="mb-12 overflow-hidden rounded-lg border-2 border-accent/40 bg-surface shadow-card">
        <div className="flex items-center justify-between border-b border-border bg-surface-tint px-6 py-2">
          <span className="inline-flex items-center gap-2 text-caption font-bold uppercase tracking-wider text-accent">
            <Icon icon={Star} size="sm" />
            Featured Flagship Research Cohort
          </span>
          <span className="font-mono text-caption font-semibold text-muted">
            SKU: #{FEATURED_PRODUCT.sku}
          </span>
        </div>
        <div className="grid grid-cols-1 items-center gap-8 p-6 md:p-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {FEATURED_PRODUCT.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-sm bg-surface-tint-2 px-2 py-0.5 text-caption font-semibold text-heading"
                >
                  {badge}
                </span>
              ))}
            </div>
            <Heading level={2} size="h3" className="mb-3">
              {FEATURED_PRODUCT.title}
            </Heading>
            <Text size="body" tone="muted" className="mb-4">
              {FEATURED_PRODUCT.description}
            </Text>
            <div className="mb-6 grid grid-cols-2 gap-3 rounded-md border border-border bg-surface-subtle p-4 sm:grid-cols-3">
              {FEATURED_PRODUCT.specs.map((spec) => (
                <div key={spec.label}>
                  <span className="block text-caption text-muted">{spec.label}</span>
                  <span className="font-semibold text-heading">{spec.value}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <span className="block text-caption font-medium text-muted">
                  Institutional Quotation
                </span>
                <span className="font-wordmark text-h2 font-bold text-heading">
                  {FEATURED_PRODUCT.price}
                </span>
                <span className="ml-1 text-caption font-semibold text-accent">
                  {FEATURED_PRODUCT.priceNote}
                </span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <ProductPurchaseActions
                  sku={FEATURED_PRODUCT.sku}
                  enquiryHref={productEnquiryHref(FEATURED_PRODUCT.sku)}
                />
                <AppButtonLink href="/methodology" variant="outline">
                  Technical Data Sheet
                </AppButtonLink>
              </div>
            </div>
          </div>
          <div className="relative h-[300px] overflow-hidden rounded-md border border-border bg-surface-tint-2 lg:col-span-5">
            <Image
              src={FEATURED_PRODUCT.imageSrc}
              alt="Laboratory imaging suite used for QC of authenticated cell cohorts."
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 40vw, 100vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-primary-900/90 to-transparent p-4 text-on-primary">
              <div className="flex items-center justify-between text-caption font-medium">
                <span>{FEATURED_PRODUCT.imageCaption}</span>
                <span className="rounded-sm bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  QC Verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <Heading level={2} size="h3">
            Catalog Directory
          </Heading>
          <Text size="caption" tone="muted">
            Shippable SKUs with CoA, cold-chain options, and institutional MTA where required.
          </Text>
        </div>
        <Text size="caption" tone="muted">
          Showing {filtered.length} of {CATALOG_PRODUCT_COUNT} items
        </Text>
      </div>

      <section
        id="catalog-grid"
        className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {filtered.map((product) => (
          <article
            key={product.sku}
            className="relative flex flex-col justify-between rounded-lg border border-border bg-surface p-5 shadow-card"
          >
            <div className="-mx-5 -mt-5 mb-4 rounded-t-lg border-t-4 border-accent" />
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="rounded-sm bg-surface-tint px-2 py-0.5 font-mono text-xs font-bold text-accent">
                  Cat #{product.sku}
                </span>
                <span className="rounded-sm bg-surface-tint-2 px-2 py-0.5 text-caption font-medium text-heading">
                  {product.categoryLabel}
                </span>
              </div>
              <Heading level={3} size="h4" className="mb-2">
                {product.title}
              </Heading>
              <Text size="caption" tone="muted" className="mb-2">
                {product.description}
              </Text>
              {product.shippingNote ? (
                <Text size="caption" className="mb-3 font-medium text-accent">
                  Shipping: {product.shippingNote}
                </Text>
              ) : null}
              <ul className="mb-4 list-none space-y-1 p-0 text-caption">
                {product.specs.map((spec) => (
                  <li key={spec} className="flex items-center gap-1.5">
                    <Icon icon={CheckCircle2} size="sm" className="text-accent" />
                    {spec}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
              <div>
                <span className="block text-caption font-medium text-muted">
                  {product.packLabel}
                </span>
                <span className="font-wordmark text-h4 font-bold text-heading">
                  {product.price}
                </span>
              </div>
              <ProductPurchaseActions
                sku={product.sku}
                enquiryHref={productEnquiryHref(product.sku)}
                compact
              />
            </div>
          </article>
        ))}
      </section>

      <section className="mb-12 rounded-lg border border-border bg-surface p-8 shadow-card">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <Heading level={2} size="h3" className="mb-2">
            Laboratory Compliance & Quality Rigor
          </Heading>
          <Text size="caption" tone="muted">
            Every physical lot is batch-released with documented QC before dispatch from our Haripur
            facility.
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <QualityCard
            title="STR Fingerprinting & Purity"
            body="All cell lines undergo 16-marker STR DNA profiling. Batch lots are verified negative for mycoplasma using nested PCR and fluorescent Hoechst 33258 staining."
          />
          <QualityCard
            title="Cold-Chain Telemetry"
            body="Cryogenic biological specimens are dispatched in monitored dry-vapor shippers (-196°C) with real-time temperature loggers accessible to receiving facilities."
          />
          <QualityCard
            title="Institutional MTA Protocols"
            body="Seamless standard Material Transfer Agreements (MTAs) aligned with global RUO regulations to accelerate procurement for university and pharma laboratories."
          />
        </div>
      </section>

      <section
        id="order-process"
        className="mb-12 rounded-lg border border-border bg-surface-tint p-8"
      >
        <div className="mb-8 max-w-2xl">
          <span className="mb-1 block text-caption font-bold uppercase tracking-wider text-accent">
            Standard Operating Procedure
          </span>
          <Heading level={2} size="h3">
            Institutional Procurement Protocol
          </Heading>
          <Text tone="muted">
            Simple, regulated pathway for biopharma partners, hospital biobanks, and university
            departments.
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: '1',
              title: 'Select & Request Quote',
              body: 'Identify catalog SKUs and indicate intended research quantity or trial scale.',
            },
            {
              n: '2',
              title: 'Review CoA & MTA',
              body: 'Receive batch lot data, QC release documents, and execute standard RUO MTA terms.',
            },
            {
              n: '3',
              title: 'PO / Grant Processing',
              body: 'Process institutional Purchase Orders (PO), NIH/HEC academic grant disbursements.',
            },
            {
              n: '4',
              title: 'Cold-Chain Delivery',
              body: 'Express temperature-monitored courier directly to recipient laboratory loading dock.',
            },
          ].map((step) => (
            <div key={step.n} className="relative rounded-md border border-border bg-surface p-5">
              <span className="absolute top-3 right-4 font-wordmark text-h2 font-bold text-primary-200">
                0{step.n}
              </span>
              <div className="mb-3 flex size-8 items-center justify-center rounded-sm bg-primary-700 text-caption font-bold text-on-primary">
                {step.n}
              </div>
              <Heading level={3} size="h4" className="mb-1">
                {step.title}
              </Heading>
              <Text size="caption" tone="muted">
                {step.body}
              </Text>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mb-12 overflow-hidden rounded-lg bg-primary-700 p-8 text-on-primary shadow-md">
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="max-w-2xl">
            <Heading level={2} size="h3" className="mb-2 text-on-primary">
              Need custom reagent formulation, bulk assay synthesis, or proprietary cell line
              immortalization?
            </Heading>
            <Text className="text-on-primary/90">
              Our molecular pharmacology and tissue engineering laboratories collaborate directly
              with external PIs to deliver tailored biological assets under GLP compliance.
            </Text>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <AppButtonLink href="/contact" variant="accent">
              Contact Product Specialist
            </AppButtonLink>
            <AppButtonLink href="/services" variant="ghost" className="text-on-primary">
              Browse Services Portfolio
            </AppButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}

function Assurance({
  icon,
  title,
  body,
}: {
  readonly icon: typeof FileText;
  readonly title: string;
  readonly body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border border-border bg-surface-subtle p-3">
      <Icon icon={icon} size="lg" className="text-accent" />
      <div>
        <Heading level={2} size="h4">
          {title}
        </Heading>
        <Text size="caption" tone="muted">
          {body}
        </Text>
      </div>
    </div>
  );
}

function QualityCard({ title, body }: { readonly title: string; readonly body: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-surface-subtle p-5 text-center">
      <Heading level={3} size="h4" className="mb-2">
        {title}
      </Heading>
      <Text size="caption" tone="muted">
        {body}
      </Text>
    </div>
  );
}
