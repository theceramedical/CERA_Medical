import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { CheckCircle2, LayoutList, ShieldCheck } from 'lucide-react';

import {
  PRODUCT_CATEGORIES,
  filterCatalog,
  productCatalogAnchorId,
  productDetailPath,
  productEnquiryHref,
  type CatalogProduct,
  type ProductCategory,
} from '../../content/products-catalog.ts';
import { AppButtonLink, AppLink } from '../link.tsx';

import { ProductPurchaseActions } from './product-purchase-actions.tsx';

export function ProductsCatalog({
  products,
  query,
  category,
}: {
  readonly products: readonly CatalogProduct[];
  readonly query?: string;
  readonly category?: string;
}) {
  const activeCategory = (category ?? 'all') as 'all' | ProductCategory;
  const filtered = filterCatalog(products, {
    ...(query === undefined ? {} : { q: query }),
    category: activeCategory,
  });

  return (
    <div className="mx-auto max-w-site px-6 py-6 md:px-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 text-caption text-muted">
        <AppLink href="/">Home</AppLink>
        <span aria-hidden="true">/</span>
        <span className="font-semibold text-heading">Research Catalogue</span>
      </nav>

      <section className="mb-8 rounded-lg border border-border bg-surface p-8 shadow-card">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent bg-surface-tint px-3 py-1 text-caption font-semibold text-accent">
              <Icon icon={ShieldCheck} size="sm" />
              RESEARCH CATALOGUE · ASK ABOUT AVAILABILITY
            </p>
            <Heading level={1} size="h1" className="mb-3">
              Research Products
            </Heading>
            <Text size="body-lg" tone="muted" className="max-w-2xl">
              Research-use reagents, kits and cell preparations. All products are for research use
              only and are priced on enquiry. Please contact us to confirm availability,
              documentation and delivery.
            </Text>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
            <AppButtonLink href="#catalog-grid" variant="primary">
              <Icon icon={LayoutList} size="sm" />
              Browse Catalogue ({products.length})
            </AppButtonLink>
          </div>
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
            const label =
              tab.id === 'all' ? `All Products (${String(products.length)})` : tab.label;
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
                {label}
              </AppLink>
            );
          })}
        </div>
      </section>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <Heading level={2} size="h3">
            Catalog Directory
          </Heading>
          <Text size="caption" tone="muted">
            Confirm the scope, availability and terms for a catalogue entry with our team.
          </Text>
        </div>
        <Text size="caption" tone="muted">
          Showing {filtered.length} of {products.length} items
        </Text>
      </div>

      <section
        id="catalog-grid"
        className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-8 md:col-span-2 lg:col-span-3">
            <Heading level={3} size="h4" className="mb-2">
              {products.length === 0
                ? 'No confirmed products are currently listed'
                : 'No catalogue entries match this search'}
            </Heading>
            <Text tone="muted">
              {products.length === 0
                ? 'Contact us to enquire about research-use products. We confirm availability, documentation and delivery by email.'
                : 'Try another search term or contact us to ask about research-use products.'}
            </Text>
            <AppButtonLink href="/enquiry" variant="outline" className="mt-4">
              Make an Enquiry
            </AppButtonLink>
          </div>
        ) : null}
        {filtered.map((product) => (
          <article
            key={product.sku}
            id={productCatalogAnchorId(product.sku)}
            className="relative flex flex-col justify-between rounded-lg border border-border bg-surface p-5 shadow-card"
          >
            <div className="-mx-5 -mt-5 mb-4 rounded-t-lg border-t-4 border-accent" />
            {product.imageUrl ? (
              <div className="-mx-5 mb-4 overflow-hidden">
                <img src={product.imageUrl} alt="" className="h-40 w-full object-cover" />
              </div>
            ) : null}
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
                <AppLink
                  href={productDetailPath(product.sku)}
                  className="text-heading underline decoration-1 underline-offset-2 hover:text-accent hover:decoration-2"
                >
                  {product.title}
                </AppLink>
              </Heading>
              <Text size="caption" tone="muted" className="mb-2">
                {product.description}
              </Text>
              {product.shippingNote ? (
                <Text size="caption" className="mb-3 font-medium text-accent">
                  Availability note: {product.shippingNote}
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
                <span className="font-wordmark text-caption font-semibold text-heading">
                  Price on enquiry
                </span>
                {product.packLabel ? (
                  <span className="block text-caption font-medium text-muted">
                    {product.packLabel}
                  </span>
                ) : null}
              </div>
              <ProductPurchaseActions enquiryHref={productEnquiryHref(product.sku)} compact />
            </div>
          </article>
        ))}
      </section>

      <p className="mb-12 text-center text-body text-muted">
        Select a product and send a request; we confirm availability and terms by email.
      </p>

      <section className="relative mb-12 overflow-hidden rounded-lg bg-primary-700 p-8 text-on-primary shadow-md">
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="max-w-2xl">
            <Heading level={2} size="h3" className="mb-2 text-on-primary">
              Have a product question?
            </Heading>
            <Text className="text-on-primary/90">
              Send us an enquiry and include the catalogue number so we can confirm availability.
            </Text>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <AppButtonLink href="/contact" variant="accent">
              Make an Enquiry
            </AppButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
