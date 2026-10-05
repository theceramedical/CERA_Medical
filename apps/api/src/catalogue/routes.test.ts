import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { memoryCatalogueCache } from './cache.ts';
import { catalogueRoutes } from './routes.ts';

import type { VendureProduct } from './types.ts';
import type { VendureCatalogueClient } from './vendure-client.ts';

const cardiology: VendureProduct = {
  id: '1',
  slug: 'cardiology',
  name: 'Cardiology',
  description: 'Heart.',
  enabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  collections: [{ id: 'c1', slug: 'specialist', name: 'Specialist Care' }],
  customFields: {
    shortSummary: 'Expert care for a healthier heart.',
    enquiryEnabled: true,
    displayPriceText: 'From £250',
    availabilityText: 'Usually within 2 weeks',
    internalNotes: 'SECRET',
  },
};

const diagnostics: VendureProduct = {
  ...cardiology,
  id: '2',
  slug: 'diagnostic-tests',
  name: 'Diagnostic Tests',
  customFields: {
    ...cardiology.customFields,
    enquiryEnabled: false,
    shortSummary: 'Accurate results.',
  },
};

const withdrawn: VendureProduct = {
  ...cardiology,
  id: '3',
  slug: 'travel-vaccinations',
  name: 'Travel Vaccinations',
  enabled: false,
};

const physicalKit: VendureProduct = {
  id: '4',
  slug: 'cr-reg-1180',
  name: 'CERA-BUF-RNA',
  description: 'RNase-free buffer.',
  enabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  collections: [{ id: 'p1', slug: 'physical-products', name: 'Physical Products' }],
  variants: [{ id: 'v1', sku: 'CR-REG-1180', price: 238_000, priceWithTax: 238_000 }],
  customFields: {
    shortSummary: 'Sterile buffer.',
    enquiryEnabled: true,
    checkoutEnabled: true,
    displayPriceText: 'PKR 2,380',
    availabilityText: 'In stock',
    internalNotes: null,
  },
};

let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
});

async function build(products: readonly VendureProduct[]): Promise<FastifyInstance> {
  const client: VendureCatalogueClient = {
    listProducts: () => Promise.resolve(products.filter((product) => product.enabled !== false)),
    getProduct: (slug) =>
      Promise.resolve(
        products.find((product) => product.slug === slug && product.enabled !== false) ?? null,
      ),
  };

  const instance = Fastify({ logger: false });
  await instance.register(catalogueRoutes({ client, cache: memoryCatalogueCache() }));
  await instance.ready();
  return instance;
}

describe('GET /v1/services', () => {
  it('returns active services and never the withdrawn one or internalNotes', async () => {
    app = await build([cardiology, diagnostics, withdrawn]);
    const response = await app.inject({ method: 'GET', url: '/v1/services' });
    expect(response.statusCode).toBe(200);

    const body: { items: { slug: string }[] } = response.json();
    expect(body.items.map((item) => item.slug)).toEqual(['cardiology', 'diagnostic-tests']);
    expect(response.body).not.toContain('cr-reg-1180');
    expect(response.body).not.toContain('SECRET');
    expect(response.body).not.toContain('travel-vaccinations');
  });

  it('filters the enquiry picker when enquiryEnabled=true', async () => {
    app = await build([cardiology, diagnostics]);
    const response = await app.inject({ method: 'GET', url: '/v1/services?enquiryEnabled=true' });
    const body: { items: { slug: string }[] } = response.json();
    expect(body.items.map((item) => item.slug)).toEqual(['cardiology']);
  });
});

describe('GET /v1/products', () => {
  it('lists physical products and excludes research services', async () => {
    app = await build([cardiology, physicalKit]);
    const response = await app.inject({ method: 'GET', url: '/v1/products' });
    expect(response.statusCode).toBe(200);
    const body: { items: { sku: string }[] } = response.json();
    expect(body.items.map((item) => item.sku)).toEqual(['CR-REG-1180']);
  });
});

describe('GET /v1/products/:sku', () => {
  it('returns a physical product by SKU', async () => {
    app = await build([physicalKit]);
    const response = await app.inject({ method: 'GET', url: '/v1/products/CR-REG-1180' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ sku: 'CR-REG-1180', title: 'CERA-BUF-RNA' });
  });
});

describe('GET /v1/services/:slug', () => {
  it('returns a public service', async () => {
    app = await build([cardiology]);
    const response = await app.inject({ method: 'GET', url: '/v1/services/cardiology' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ slug: 'cardiology', enquiryEnabled: true });
  });

  it('404s the withdrawn service rather than rendering it', async () => {
    app = await build([withdrawn]);
    const response = await app.inject({ method: 'GET', url: '/v1/services/travel-vaccinations' });
    expect(response.statusCode).toBe(404);
  });
});
