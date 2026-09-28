import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { searchRoutes } from './routes.ts';

import type { VendureProduct } from '../catalogue/types.ts';
import type { VendureCatalogueClient } from '../catalogue/vendure-client.ts';

const cardiology: VendureProduct = {
  id: '1',
  slug: 'cardiology',
  name: 'Cardiology',
  description: 'Heart.',
  enabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  customFields: { shortSummary: 'Expert care for a healthier heart.', enquiryEnabled: true },
};

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

describe('GET /v1/search', () => {
  it('returns ranked active services and never logs the raw query in the body', async () => {
    const client: VendureCatalogueClient = {
      listProducts: () => Promise.resolve([cardiology]),
      getProduct: () => Promise.resolve(cardiology),
    };

    app = Fastify({ logger: false });
    await app.register(searchRoutes({ catalogue: client }));
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/v1/search?q=cardiology' });
    expect(response.statusCode).toBe(200);
    const body: { items: { slug: string }[] } = response.json();
    expect(body.items.map((item) => item.slug)).toEqual(['cardiology']);
  });

  it('rejects a one-character query', async () => {
    const client: VendureCatalogueClient = {
      listProducts: () => Promise.resolve([]),
      getProduct: () => Promise.resolve(null),
    };
    app = Fastify({ logger: false });
    await app.register(searchRoutes({ catalogue: client }));
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/v1/search?q=a' });
    expect(response.statusCode).toBe(400);
  });
});
