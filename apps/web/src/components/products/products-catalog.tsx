import { Icon } from '@cera/ui/icon';
import { Heading, Text } from '@cera/ui/typography';
import { CheckCircle2, FlaskConical, Leaf, Search, ShieldCheck, Sparkles } from 'lucide-react';

import {
  PRODUCT_CATEGORIES,
  filterCatalog,
  productCatalogAnchorId,
  productDetailPath,
  productEnquiryHref,
  type CatalogProduct,
  type ProductCategory,
} from '../../content/products-catalog.ts';
import { LabMouseIcon } from '../icons/lab-mouse-icon.tsx';
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
        <span className="font-semibold text-heading">Products & Formulation Portfolio</span>
      </nav>

      <section className="relative mb-8 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-surface via-surface-subtle to-surface-tint p-8 shadow-card">
        <div className="relative z-10 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-3xl">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary-50 px-3 py-1 text-caption font-bold text-primary">
                <LabMouseIcon size={14} />
                BIOMEDICAL FORMULATIONS & PRECLINICAL REAGENTS
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-surface px-3 py-1 text-caption font-semibold text-accent">
                <ShieldCheck size={14} />
                GLP COMPLIANT & CERTIFIED
              </span>
            </div>
            <Heading level={1} size="h1" className="mb-3">
              Research & Wellness Products
            </Heading>
            <Text size="body-lg" tone="muted" className="max-w-2xl leading-relaxed">
              Explore CERA Medical&apos;s plant-based natural wellness formulations developed from
              biomedical evidence alongside authenticated laboratory research reagents, molecular
              assay kits, and preclinical rodent cell preparations.
            </Text>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:flex-col">
            <AppButtonLink
              href="#catalog-grid"
              variant="primary"
              iconStart={<LabMouseIcon size={17} />}
            >
              Browse Portfolio ({products.length})
            </AppButtonLink>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-xl border border-border bg-surface p-5 shadow-card">
        <form method="get" className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <span className="absolute inset-y-0 left-3 flex items-center text-muted">
              <Search size={17} aria-hidden="true" />
            </span>
            <input
              name="q"
              defaultValue={query ?? ''}
              placeholder="Search formulations, botanicals, active compounds, SKUs, or assay kits..."
              className="h-11 w-full rounded-lg border border-border bg-surface pl-10 pr-3 text-body-sm transition-colors focus:border-primary focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-caption font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            Search Catalogue
          </button>
          {activeCategory !== 'all' ? (
            <input type="hidden" name="category" value={activeCategory} />
          ) : null}
        </form>

        <div
          className="flex items-center gap-2 overflow-x-auto border-t border-border/80 pt-4"
          role="tablist"
          aria-label="Product categories"
        >
          {PRODUCT_CATEGORIES.map((tab) => {
            const count =
              tab.id === 'all'
                ? products.length
                : products.filter((p) => p.category === tab.id).length;
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
                    ? 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-caption font-semibold text-on-primary no-underline shadow-xs'
                    : 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-surface-subtle px-4 py-2 text-caption font-medium text-muted no-underline hover:border-primary/40 hover:text-heading'
                }
              >
                {tab.id === 'preclinical' ? <LabMouseIcon size={14} /> : null}
                {tab.id === 'wellness' ? <Leaf size={14} /> : null}
                {tab.id === 'reagents' ? <FlaskConical size={14} /> : null}
                <span>{tab.label}</span>
                <span className={selected ? 'text-on-primary/75' : 'text-muted'}>({count})</span>
              </AppLink>
            );
          })}
        </div>
      </section>

      <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <Heading level={2} size="h3">
            Portfolio Catalogue
          </Heading>
          <Text size="caption" tone="muted" className="mt-1">
            Confirmed availability, batch documentation, and pricing for health products and
            laboratory supplies.
          </Text>
        </div>
        <Text size="caption" tone="muted" className="font-semibold">
          Showing {filtered.length} of {products.length} formulations & reagents
        </Text>
      </div>

      <section
        id="catalog-grid"
        className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center md:col-span-2 lg:col-span-3">
            <Heading level={3} size="h4" className="mb-2">
              No catalogue entries match your filter
            </Heading>
            <Text tone="muted">
              Try adjusting your search keywords or select &quot;All Products&quot; to browse the
              full formulation range.
            </Text>
            <AppButtonLink href="/products" variant="outline" className="mt-4">
              Reset Filters
            </AppButtonLink>
          </div>
        ) : null}

        {filtered.map((product) => {
          const isWellness = product.category === 'wellness';
          const isPreclinical = product.category === 'preclinical' || product.isMouseModel;

          return (
            <article
              key={product.sku}
              id={productCatalogAnchorId(product.sku)}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface shadow-xs transition-shadow hover:shadow-md"
            >
              {/* Category-coded Accent Top Stripe */}
              <div
                className={`h-1.5 w-full ${
                  isWellness ? 'bg-emerald-600' : isPreclinical ? 'bg-primary' : 'bg-accent'
                }`}
              />

              <div className="flex flex-1 flex-col p-6">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="rounded-md bg-surface-subtle px-2 py-0.5 font-mono text-[0.7rem] font-bold text-muted">
                    {product.sku}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-bold ${
                      isWellness
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                        : isPreclinical
                          ? 'border border-primary/20 bg-primary-50 text-primary'
                          : 'border border-accent/20 bg-surface-tint text-accent'
                    }`}
                  >
                    {isPreclinical ? <LabMouseIcon size={12} /> : null}
                    {isWellness ? <Sparkles size={12} /> : null}
                    {product.categoryLabel}
                  </span>
                </div>

                <Heading level={3} size="h4" className="mb-2 text-heading">
                  <AppLink
                    href={productDetailPath(product.sku)}
                    className="no-underline hover:text-primary transition-colors"
                  >
                    {product.title}
                  </AppLink>
                </Heading>

                <Text size="body-sm" tone="muted" className="mb-4 leading-relaxed">
                  {product.description}
                </Text>

                {/* Botanical Ingredients Highlight */}
                {product.ingredients && product.ingredients.length > 0 ? (
                  <div className="mb-4 rounded-lg border border-border/70 bg-surface-subtle p-3 text-caption">
                    <span className="font-semibold text-heading flex items-center gap-1 mb-1.5">
                      <Leaf size={13} className="text-emerald-600" />
                      Key Botanical Actives:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-muted pl-1">
                      {product.ingredients.map((ing) => (
                        <li key={ing}>{ing}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Key Specifications / Benefits */}
                <ul className="mb-5 list-none space-y-1.5 p-0 text-caption">
                  {product.specs.slice(0, 4).map((spec) => (
                    <li key={spec} className="flex items-start gap-2 text-muted">
                      <Icon
                        icon={CheckCircle2}
                        size="sm"
                        className={`mt-0.5 shrink-0 ${
                          isWellness ? 'text-emerald-600' : 'text-primary'
                        }`}
                      />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>

                {product.directions ? (
                  <p className="mt-auto mb-4 text-[0.75rem] text-muted border-t border-border/50 pt-2 italic">
                    <span className="font-semibold not-italic">Directions:</span>{' '}
                    {product.directions}
                  </p>
                ) : null}
              </div>

              {/* Bottom Action & Pricing Row */}
              <div className="border-t border-border bg-surface-subtle/50 p-5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-heading text-body-sm sm:text-body">
                    {product.price ?? 'Price on enquiry'}
                  </div>
                  {product.packLabel ? (
                    <span className="block text-[0.75rem] text-muted">{product.packLabel}</span>
                  ) : null}
                </div>
                <ProductPurchaseActions
                  enquiryHref={productEnquiryHref(product.sku)}
                  compact
                  label={isWellness ? 'Order / Enquire' : 'Request Scoping'}
                />
              </div>
            </article>
          );
        })}
      </section>

      <section className="relative mb-12 overflow-hidden rounded-2xl bg-primary-900 p-8 text-on-primary shadow-lg sm:p-10">
        <div className="relative z-10 flex flex-col items-center justify-between gap-6 lg:flex-row">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-on-primary/20 bg-on-primary/10 px-3 py-1 text-caption font-semibold text-accent uppercase">
              <LabMouseIcon size={14} />
              Custom Animal House & Molecular Formulations
            </div>
            <Heading level={2} size="h3" className="mt-3 text-on-primary">
              Need custom research reagents or rodent animal cohorts?
            </Heading>
            <Text className="mt-2 text-on-primary/85 leading-relaxed">
              Our In Vivo vivarium and analytical laboratories prepare tailored compound
              preparations, custom disease cohorts, and validated extraction buffers under strict
              institutional ethics oversight.
            </Text>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <AppButtonLink
              href="/contact#contact-form"
              variant="accent"
              size="lg"
              iconStart={<LabMouseIcon size={18} />}
            >
              Consult Study Director
            </AppButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
