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
  ProductService,
  ProductVariantService,
  RequestContextService,
} from '@vendure/core';

import { SEED_COLLECTIONS, SEED_SERVICES } from './seed-data.ts';
import { getConfig } from './vendure-config.ts';

async function main(): Promise<void> {
  if (process.env.CERA_ENV === 'production' || process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed the catalogue in production.');
  }

  const app = await bootstrap(getConfig());
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

  const ctx = await requestContext.create({ apiType: 'admin' });
  const collectionIds = new Map<string, string>();

  for (const collection of SEED_COLLECTIONS) {
    const existing = await collections.findOneBySlug(ctx, collection.slug);
    if (existing !== undefined) {
      collectionIds.set(collection.slug, String(existing.id));
      continue;
    }

    const created = await collections.create(ctx, {
      translations: [{ languageCode: LanguageCode.en, name: collection.name, slug: collection.slug, description: '' }],
      filters: [],
    });
    collectionIds.set(collection.slug, String(created.id));
  }

  for (const service of SEED_SERVICES) {
    const existing = await products.findOneBySlug(ctx, service.slug);
    const customFields = {
      enquiryEnabled: service.enquiryEnabled,
      availabilityText: service.availabilityText ?? undefined,
      displayPriceText: service.displayPriceText ?? undefined,
      shortSummary: service.summary,
      internalNotes: service.internalNotes ?? undefined,
    };

    if (existing === undefined) {
      const created = await products.create(ctx, {
        enabled: service.enabled,
        translations: [
          {
            languageCode: LanguageCode.en,
            name: service.name,
            slug: service.slug,
            description: service.description,
          },
        ],
        customFields,
      });

      await variants.create(ctx, [
        {
          productId: created.id,
          sku: service.slug,
          price: 0,
          stockOnHand: 0,
          translations: [{ languageCode: LanguageCode.en, name: service.name }],
        },
      ]);
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
          },
        ],
        customFields,
      });
    }
  }

  console.warn(`Catalogue seed complete. ${String(SEED_SERVICES.length)} services.`);
}

await main();
