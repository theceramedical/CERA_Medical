import { SearchQuerySchema, SearchResponseSchema } from '@cera/contracts';
import { ApiError } from '@cera/contracts/errors';

import { mapVendureProduct, toListablePublicService } from '../catalogue/map.ts';
import { sendApiError, sendCode, sendZodError } from '../http.ts';

import { rankSearch, type Searchable } from './rank.ts';

import type { VendureCatalogueClient } from '../catalogue/vendure-client.ts';
import type { FastifyPluginCallback } from 'fastify';

export interface SearchDependencies {
  readonly catalogue: VendureCatalogueClient;
  readonly extra?: () => Promise<readonly Searchable[]>;
}

export const searchRoutes = (deps: SearchDependencies): FastifyPluginCallback => {
  return (app, _options, done) => {
    app.get('/v1/search', async (request, reply) => {
      const parsed = SearchQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        sendZodError(request, reply, parsed.error);
        return;
      }

      try {
        const products = await deps.catalogue.listProducts();
        const services: Searchable[] = products
          .map(mapVendureProduct)
          .map(toListablePublicService)
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .map((item) => ({
            kind: 'service',
            type: 'service',
            slug: item.slug,
            title: item.title,
            excerpt: item.summary,
          }));

        const extra = deps.extra === undefined ? [] : await deps.extra();
        let combined = [...services, ...extra];
        if (parsed.data.type === 'service') {
          combined = combined.filter((item) => item.kind === 'service');
        } else if (parsed.data.type !== undefined) {
          combined = combined.filter((item) => item.type === parsed.data.type);
        }

        const items = rankSearch(parsed.data.q, combined);
        return reply.code(200).send(SearchResponseSchema.parse({ items, nextCursor: null }));
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
