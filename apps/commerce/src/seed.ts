/**
 * Idempotent catalogue bootstrap. Production use requires a deploy approval flag.
 *
 * Superadmin credentials come from the environment with no fallback. A default
 * password here is how a development login reaches a deployed dashboard.
 */

import {
  bootstrap,
  CollectionService,
  LanguageCode,
  JobQueueService,
  PaymentMethodService,
  ProductService,
  ProductVariantService,
  Populator,
  RequestContextService,
  ShippingMethodService,
} from '@vendure/core';

import {
  RETIRED_SERVICE_SLUGS,
  SEED_COLLECTIONS,
  SEED_PHYSICAL_PRODUCTS,
  SEED_SERVICES,
} from './seed-data.js';
import { assertCatalogueSeedAllowed } from './seed-environment.js';
import { getConfig } from './vendure-config.js';

async function main(): Promise<void> {
  assertCatalogueSeedAllowed(process.env);

  const app = await bootstrap(getConfig({ seed: true }));
  await app.get(JobQueueService).start();
  try {
    await seedCatalogue(app);
  } finally {
    await app.close();
  }
}

async function seedCatalogue(app: Awaited<ReturnType<typeof bootstrap>>): Promise<void> {
  const requestContext = app.get(RequestContextService);
  const products = app.get(ProductService);
  const variants = app.get(ProductVariantService);
  const collections = app.get(CollectionService);

  let ctx = await requestContext.create({ apiType: 'admin' });
  // Vendure types this relation as required, but a fresh database has no zone yet.
  const hasTaxZone = (channel: { readonly defaultTaxZone?: unknown }): boolean =>
    channel.defaultTaxZone != null;
  if (!hasTaxZone(ctx.channel)) {
    await app.get(Populator).populateInitialData({
      defaultLanguage: LanguageCode.en,
      defaultZone: 'Local catalogue',
      countries: [{ code: 'PK', name: 'Pakistan', zone: 'Local catalogue' }],
      taxRates: [{ name: 'Catalogue only', percentage: 0 }],
      shippingMethods: [],
      paymentMethods: [],
      collections: [],
    });
    ctx = await requestContext.create({ apiType: 'admin' });
  }
  collections.setApplyAllFiltersOnProductUpdates(false);
  const assignedProducts = new Map<string, string[]>();
  const collectionIds = new Map<string, string | number>();

  for (const collection of SEED_COLLECTIONS) {
    const existing = await collections.findOneBySlug(ctx, collection.slug);
    if (existing !== undefined) {
      collectionIds.set(collection.slug, existing.id);
      continue;
    }

    const created = await collections.create(ctx, {
      translations: [
        {
          languageCode: LanguageCode.en,
          name: collection.name,
          slug: collection.slug,
          description: '',
        },
      ],
      filters: [],
    });
    collectionIds.set(collection.slug, created.id);
  }

  for (const service of SEED_SERVICES) {
    await seedCatalogueEntry(ctx, products, variants, assignedProducts, {
      slug: service.slug,
      sku: service.slug,
      name: service.name,
      description: service.description,
      summary: service.summary,
      collectionSlug: service.collectionSlug,
      listPriceMinor: service.listPriceMinor,
      displayPriceText: service.displayPriceText,
      availabilityText: service.availabilityText,
      stockOnHand: 999_999,
      enabled: service.enabled,
      enquiryEnabled: service.enquiryEnabled,
      checkoutEnabled: service.checkoutEnabled,
      internalNotes: service.internalNotes,
    });
  }

  for (const product of SEED_PHYSICAL_PRODUCTS) {
    const slug = product.sku.toLowerCase();
    await seedCatalogueEntry(ctx, products, variants, assignedProducts, {
      slug,
      sku: product.sku,
      name: product.name,
      description: product.description,
      summary: product.summary,
      collectionSlug: 'physical-products',
      listPriceMinor: product.listPriceMinor,
      displayPriceText: product.displayPriceText,
      availabilityText: 'Shippable RUO product — dispatch after batch release',
      stockOnHand: product.stockOnHand,
      enabled: true,
      enquiryEnabled: true,
      checkoutEnabled: true,
      internalNotes: null,
    });
  }

  if (process.env.CHECKOUT_ENABLED === 'true') {
    await ensureCheckoutMethods(ctx, app);
  }

  for (const slug of RETIRED_SERVICE_SLUGS) {
    const retired = await products.findOneBySlug(ctx, slug);
    if (retired !== undefined) {
      await products.update(ctx, {
        id: retired.id,
        enabled: false,
        customFields: { enquiryEnabled: false },
      });
    }
  }

  for (const [slug, ids] of assignedProducts) {
    const id = collectionIds.get(slug);

    if (id === undefined) throw new Error(`Missing collection ${slug}`);
    await collections.update(ctx, {
      id,
      filters: [
        {
          code: 'product-id-filter',
          arguments: [
            { name: 'productIds', value: JSON.stringify(ids) },
            { name: 'combineWithAnd', value: 'true' },
          ],
        },
      ],
    });
  }
  await collections.triggerApplyFiltersJob(ctx, { collectionIds: [...collectionIds.values()] });
  const deadline = Date.now() + 30_000;
  for (const [slug, ids] of assignedProducts) {
    for (;;) {
      const collection = await collections.findOneBySlug(ctx, slug, ['productVariants']);
      if (collection === undefined) throw new Error(`Missing collection ${slug}`);
      if (collection.productVariants.length >= ids.length) break;
      if (Date.now() > deadline) throw new Error(`Timed out assigning ${slug}`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  console.warn(
    `Catalogue seed complete. ${String(SEED_SERVICES.length)} services, ${String(SEED_PHYSICAL_PRODUCTS.length)} physical products.`,
  );
}

async function seedCatalogueEntry(
  ctx: Awaited<ReturnType<RequestContextService['create']>>,
  products: ProductService,
  variants: ProductVariantService,
  assignedProducts: Map<string, string[]>,
  entry: {
    readonly slug: string;
    readonly sku: string;
    readonly name: string;
    readonly description: string;
    readonly summary: string;
    readonly collectionSlug: string;
    readonly listPriceMinor: number;
    readonly displayPriceText: string | null;
    readonly availabilityText: string | null;
    readonly stockOnHand: number;
    readonly enabled: boolean;
    readonly enquiryEnabled: boolean;
    readonly checkoutEnabled: boolean;
    readonly internalNotes: string | null;
  },
): Promise<void> {
  const existing = await products.findOneBySlug(ctx, entry.slug);
  const customFields = {
    enquiryEnabled: entry.enquiryEnabled,
    checkoutEnabled: entry.checkoutEnabled,
    internalNotes: entry.internalNotes ?? undefined,
  };
  const localizedFields = {
    availabilityText: entry.availabilityText ?? undefined,
    displayPriceText: entry.displayPriceText ?? undefined,
    shortSummary: entry.summary,
  };

  let productId = existing?.id;
  if (existing === undefined) {
    const created = await products.create(ctx, {
      enabled: entry.enabled,
      translations: [
        {
          languageCode: LanguageCode.en,
          name: entry.name,
          slug: entry.slug,
          description: entry.description,
          customFields: localizedFields,
        },
      ],
      customFields,
    });

    productId = created.id;
  }
  if (productId !== undefined)
    assignedProducts.set(entry.collectionSlug, [
      ...(assignedProducts.get(entry.collectionSlug) ?? []),
      String(productId),
    ]);
  const seededVariants = await variants.findAll(ctx, {
    filter: { sku: { eq: entry.sku } },
    take: 1,
  });
  if (seededVariants.totalItems === 0 && productId !== undefined) {
    await variants.create(ctx, [
      {
        productId,
        sku: entry.sku,
        price: entry.listPriceMinor,
        stockOnHand: entry.stockOnHand,
        translations: [{ languageCode: LanguageCode.en, name: entry.name }],
      },
    ]);
  } else if (seededVariants.items[0] !== undefined) {
    const variant = seededVariants.items[0];
    await variants.update(ctx, [
      {
        id: variant.id,
        price: entry.listPriceMinor,
        stockOnHand: entry.stockOnHand,
      },
    ]);
  }
}

async function ensureCheckoutMethods(
  ctx: Awaited<ReturnType<RequestContextService['create']>>,
  app: Awaited<ReturnType<typeof bootstrap>>,
): Promise<void> {
  const shipping = app.get(ShippingMethodService);
  const payments = app.get(PaymentMethodService);

  const existingShipping = await shipping.findAll(ctx, { take: 10 });
  const hasLaboratoryShipping = existingShipping.items.some(
    (method) => method.code === 'laboratory-shipping',
  );
  if (!hasLaboratoryShipping) {
    await shipping.create(ctx, {
      code: 'laboratory-shipping',
      fulfillmentHandler: 'manual-fulfillment',
      checker: { code: 'default-shipping-eligibility-checker', arguments: [] },
      calculator: {
        code: 'default-shipping-calculator',
        arguments: [{ name: 'rate', value: '0' }],
      },
      translations: [
        {
          languageCode: LanguageCode.en,
          name: 'Laboratory shipping',
          description: 'Cold-chain or ambient dispatch after batch release',
        },
      ],
    });
  }

  const production = (process.env.CERA_ENV ?? 'local') === 'production';
  const hasSafepay =
    process.env.SAFEPAY_MERCHANT_SECRET !== undefined &&
    process.env.SAFEPAY_MERCHANT_SECRET.length > 0;
  const handlerCodes: { code: string; name: string }[] = [
    { code: 'cera-cod', name: 'Cash on delivery' },
  ];
  if (hasSafepay) {
    handlerCodes.unshift({ code: 'cera-safepay', name: 'Pay online (Safepay)' });
  } else if (!production) {
    handlerCodes.unshift({ code: 'cera-test-payment', name: 'Test payment' });
  }

  const existingPayments = await payments.findAll(ctx, { take: 20 });
  for (const { code, name } of handlerCodes) {
    const hasHandler = existingPayments.items.some((method) => method.handler.code === code);
    if (hasHandler) continue;
    await payments.create(ctx, {
      code,
      enabled: true,
      handler: { code, arguments: [] },
      translations: [{ languageCode: LanguageCode.en, name, description: '' }],
    });
  }
}

await main();
