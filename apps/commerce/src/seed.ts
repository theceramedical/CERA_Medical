/**
 * Idempotent catalogue seed. Safe to re-run. Refuses production.
 *
 * Superadmin credentials come from the environment with no fallback. A default
 * password here is how a development login reaches a deployed dashboard.
 */

import {
  bootstrap,
  CollectionService,
  LanguageCode,
  JobQueueService,
  ProductService,
  ProductVariantService,
  Populator,
  RequestContextService,
} from '@vendure/core';

import { RETIRED_SERVICE_SLUGS, SEED_COLLECTIONS, SEED_SERVICES } from './seed-data.js';
import { getConfig } from './vendure-config.js';

async function main(): Promise<void> {
  if (process.env.CERA_ENV === 'production' || process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed the catalogue in production.');
  }

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
    const existing = await products.findOneBySlug(ctx, service.slug);
    const customFields = {
      enquiryEnabled: service.enquiryEnabled,
      internalNotes: service.internalNotes ?? undefined,
    };
    const localizedFields = {
      availabilityText: service.availabilityText ?? undefined,
      displayPriceText: service.displayPriceText ?? undefined,
      shortSummary: service.summary,
    };

    let productId = existing?.id;
    if (existing === undefined) {
      const created = await products.create(ctx, {
        enabled: service.enabled,
        translations: [
          {
            languageCode: LanguageCode.en,
            name: service.name,
            slug: service.slug,
            description: service.description,
            customFields: localizedFields,
          },
        ],
        customFields,
      });

      productId = created.id;
    } else {
      await products.update(ctx, {
        id: existing.id,
        enabled: service.enabled,
        translations: [
          {
            languageCode: LanguageCode.en,
            name: service.name,
            slug: service.slug,
            description: service.description,
            customFields: localizedFields,
          },
        ],
        customFields,
      });
    }
    if (productId !== undefined)
      assignedProducts.set(service.collectionSlug, [
        ...(assignedProducts.get(service.collectionSlug) ?? []),
        String(productId),
      ]);
    const seededVariants = await variants.findAll(ctx, {
      filter: { sku: { eq: service.slug } },
      take: 1,
    });
    if (seededVariants.totalItems === 0 && productId !== undefined) {
      await variants.create(ctx, [
        {
          productId,
          sku: service.slug,
          price: 0,
          stockOnHand: 0,
          translations: [{ languageCode: LanguageCode.en, name: service.name }],
        },
      ]);
    }
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
  console.warn(`Catalogue seed complete. ${String(SEED_SERVICES.length)} services.`);
}

await main();
