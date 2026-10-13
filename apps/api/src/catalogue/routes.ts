import {
  ListProductsResponseSchema,
  ListServicesQuerySchema,
  ListServicesResponseSchema,
  ProductSkuParamsSchema,
  ServiceParamsSchema,
} from '@cera/contracts';
import { ApiError } from '@cera/contracts/errors';

import { sendApiError, sendCode, sendZodError } from '../http.ts';

import { catalogueKeys, type CatalogueCache } from './cache.ts';
import {
  isPhysicalCatalogueProduct,
  mapVendureProduct,
  mapVendurePublicProduct,
  toListablePublicService,
} from './map.ts';

import type { VendureProduct } from './types.ts';
import type { VendureCatalogueClient } from './vendure-client.ts';
import type { FastifyPluginCallback } from 'fastify';

export interface CatalogueDependencies {
  readonly client: VendureCatalogueClient;
  readonly cache: CatalogueCache;
  /** Origin for resolving relative Vendure asset preview paths (no `/shop-api`). */
  readonly vendurePublicOrigin: string;
}

const { LIST_KEY, itemKey, CATALOGUE_TTL_SECONDS } = catalogueKeys();

export const catalogueRoutes = (deps: CatalogueDependencies): FastifyPluginCallback => {
  return (app, _options, done) => {
    app.get('/v1/services', async (request, reply) => {
      const parsed = ListServicesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        sendZodError(request, reply, parsed.error);
        return;
      }

      try {
        const services = (await listRawCached(deps))
          .filter((product) => !isPhysicalCatalogueProduct(product))
          .map((product) => mapVendureProduct(product, deps.vendurePublicOrigin));
        let items = services
          .map(toListablePublicService)
          .filter((item): item is NonNullable<typeof item> => item !== null);

        if (parsed.data.enquiryEnabled === true) {
          items = items.filter((item) => item.enquiryEnabled);
        }
        if (parsed.data.enquiryEnabled === false) {
          items = items.filter((item) => !item.enquiryEnabled);
        }
        if (parsed.data.category !== undefined) {
          const category = parsed.data.category;
          items = items.filter((item) => item.category?.slug === category);
        }

        const body = ListServicesResponseSchema.parse({ items, nextCursor: null });
        return reply.code(200).send(body);
      } catch (error) {
        if (error instanceof ApiError) {
          sendApiError(request, reply, error);
          return;
        }
        sendCode(request, reply, 'upstream_unavailable');
      }
    });

    app.get('/v1/products', async (request, reply) => {
      try {
        const products = await listRawCached(deps);
        const items = products
          .map((product) => mapVendurePublicProduct(product, deps.vendurePublicOrigin))
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .sort((a, b) => a.sku.localeCompare(b.sku));
        const body = ListProductsResponseSchema.parse({ items, nextCursor: null });
        return reply.code(200).send(body);
      } catch (error) {
        if (error instanceof ApiError) {
          sendApiError(request, reply, error);
          return;
        }
        sendCode(request, reply, 'upstream_unavailable');
      }
    });

    app.get('/v1/products/:sku', async (request, reply) => {
      const parsed = ProductSkuParamsSchema.safeParse(request.params);
      if (!parsed.success) {
        sendZodError(request, reply, parsed.error);
        return;
      }

      try {
        const raw =
          (await listRawCached(deps)).find((product) =>
            product.variants?.some((variant) => variant.sku.toUpperCase() === parsed.data.sku),
          ) ?? null;
        if (raw === null) {
          sendCode(request, reply, 'not_found');
          return;
        }
        const publicProduct = mapVendurePublicProduct(raw, deps.vendurePublicOrigin);
        if (publicProduct?.sku.toUpperCase() !== parsed.data.sku) {
          sendCode(request, reply, 'not_found');
          return;
        }
        return reply.code(200).send(publicProduct);
      } catch (error) {
        if (error instanceof ApiError) {
          sendApiError(request, reply, error);
          return;
        }
        sendCode(request, reply, 'upstream_unavailable');
      }
    });

    app.get('/v1/services/:slug', async (request, reply) => {
      const parsed = ServiceParamsSchema.safeParse(request.params);
      if (!parsed.success) {
        sendZodError(request, reply, parsed.error);
        return;
      }

      try {
        const product = await getRawCached(deps, parsed.data.slug);
        const publicService =
          product === null || isPhysicalCatalogueProduct(product)
            ? null
            : toListablePublicService(mapVendureProduct(product, deps.vendurePublicOrigin));
        if (publicService === null) {
          sendCode(request, reply, 'not_found');
          return;
        }
        return reply.code(200).send(publicService);
      } catch (error) {
        if (error instanceof ApiError) {
          sendApiError(request, reply, error);
          return;
        }
        sendCode(request, reply, 'upstream_unavailable');
      }
    });

    done();
  };
};

async function listRawCached(deps: CatalogueDependencies): Promise<readonly VendureProduct[]> {
  const hit = await deps.cache.get(LIST_KEY);
  if (hit !== null) {
    return JSON.parse(hit) as VendureProduct[];
  }

  const products = await deps.client.listProducts();
  await deps.cache.set(LIST_KEY, JSON.stringify(products), CATALOGUE_TTL_SECONDS);
  return products;
}

async function getRawCached(
  deps: CatalogueDependencies,
  slug: string,
): Promise<VendureProduct | null> {
  const key = itemKey(slug);
  const hit = await deps.cache.get(key);
  if (hit !== null) {
    if (hit === 'null') return null;
    return JSON.parse(hit) as VendureProduct;
  }

  const product = await deps.client.getProduct(slug);
  await deps.cache.set(key, JSON.stringify(product), CATALOGUE_TTL_SECONDS);
  return product;
}
