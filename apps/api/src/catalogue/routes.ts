import {
  ListServicesQuerySchema,
  ListServicesResponseSchema,
  ServiceParamsSchema,
} from '@cera/contracts';
import { ApiError } from '@cera/contracts/errors';
import { toPublicService } from '@cera/contracts/projections';

import { sendApiError, sendCode, sendZodError } from '../http.ts';

import { catalogueKeys, type CatalogueCache } from './cache.ts';
import { mapVendureProduct, toListablePublicService } from './map.ts';

import type { VendureCatalogueClient } from './vendure-client.ts';
import type { FastifyPluginCallback } from 'fastify';

export interface CatalogueDependencies {
  readonly client: VendureCatalogueClient;
  readonly cache: CatalogueCache;
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
        const services = await listCached(deps);
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

    app.get('/v1/services/:slug', async (request, reply) => {
      const parsed = ServiceParamsSchema.safeParse(request.params);
      if (!parsed.success) {
        sendZodError(request, reply, parsed.error);
        return;
      }

      try {
        const service = await getCached(deps, parsed.data.slug);
        if (service?.status !== 'active') {
          sendCode(request, reply, 'not_found');
          return;
        }
        return reply.code(200).send(toPublicService(service));
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

async function listCached(deps: CatalogueDependencies) {
  const hit = await deps.cache.get(LIST_KEY);
  if (hit !== null) {
    return (JSON.parse(hit) as Parameters<typeof mapVendureProduct>[0][]).map(mapVendureProduct);
  }

  const products = await deps.client.listProducts();
  await deps.cache.set(LIST_KEY, JSON.stringify(products), CATALOGUE_TTL_SECONDS);
  return products.map(mapVendureProduct);
}

async function getCached(deps: CatalogueDependencies, slug: string) {
  const key = itemKey(slug);
  const hit = await deps.cache.get(key);
  if (hit !== null) {
    if (hit === 'null') return null;
    return mapVendureProduct(JSON.parse(hit) as Parameters<typeof mapVendureProduct>[0]);
  }

  const product = await deps.client.getProduct(slug);
  await deps.cache.set(key, JSON.stringify(product), CATALOGUE_TTL_SECONDS);
  return product === null ? null : mapVendureProduct(product);
}
