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
  slug: 'approved-buffer-001',
  name: 'Approved Buffer',
  description: 'Approved product description.',
  enabled: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  collections: [{ id: 'p1', slug: 'physical-products', name: 'Physical Products' }],
  variants: [{ id: 'v1', sku: 'APPROVED-BUFFER-001', price: 238_000, priceWithTax: 238_000 }],
  customFields: {
    shortSummary: 'Sterile buffer.',
    enquiryEnabled: true,
    checkoutEnabled: true,
    displayPriceText: 'Unverified price',
    availabilityText: 'In stock',
    internalNotes: null,
  },
};

const prototypeKit: VendureProduct = {
  ...physicalKit,
  slug: 'cr-reg-1180',
  variants: [{ id: 'v2', sku: 'CR-REG-1180', price: 238_000, priceWithTax: 238_000 }],
};

const newlyCreatedKit: VendureProduct = {
  ...physicalKit,
  id: '29',
  slug: 'new-lab-kit',
  collections: [],
  variants: [{ id: 'v29', sku: 'LAB-NEW-001', price: 3400, priceWithTax: 3400 }],
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
  await instance.register(
    catalogueRoutes({
      client,
      cache: memoryCatalogueCache(),
      vendurePublicOrigin: 'http://localhost:3002',
    }),
  );
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
    expect(body.items.map((item) => item.sku)).toEqual(['APPROVED-BUFFER-001']);
    expect(body.items[0]).toMatchObject({
      checkoutEnabled: true,
      displayPrice: 'Unverified price',
    });
  });

  it('hides the unapproved prototype catalogue record', async () => {
    app = await build([prototypeKit]);
    const response = await app.inject({ method: 'GET', url: '/v1/products' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ items: [] });
  });

  it('lists an enabled Vendure product with a variant before a collection is assigned', async () => {
    app = await build([cardiology, newlyCreatedKit]);
    const response = await app.inject({ method: 'GET', url: '/v1/products' });
    expect(response.statusCode).toBe(200);
    expect(response.json().items).toEqual([expect.objectContaining({ sku: 'LAB-NEW-001' })]);
    const services = await app.inject({ method: 'GET', url: '/v1/services' });
    expect(services.body).not.toContain('new-lab-kit');
  });
});

describe('GET /v1/products/:sku', () => {
  it('returns a physical product by SKU', async () => {
    app = await build([physicalKit]);
    const response = await app.inject({ method: 'GET', url: '/v1/products/APPROVED-BUFFER-001' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ sku: 'APPROVED-BUFFER-001', title: 'Approved Buffer' });
  });

  it('404s an unapproved prototype product detail', async () => {
    app = await build([prototypeKit]);
    const response = await app.inject({ method: 'GET', url: '/v1/products/CR-REG-1180' });
    expect(response.statusCode).toBe(404);
  });

  it('resolves a new product by variant SKU even when its slug differs', async () => {
    app = await build([newlyCreatedKit]);
    const response = await app.inject({ method: 'GET', url: '/v1/products/LAB-NEW-001' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ sku: 'LAB-NEW-001', title: 'Approved Buffer' });
  });

  it('resolves lowercase Vendure SKUs despite URL case normalization', async () => {
    app = await build([
      {
        ...newlyCreatedKit,
        variants: [{ id: 'v30', sku: '123asdasdsa', price: 3400, priceWithTax: 3400 }],
      },
    ]);
    const response = await app.inject({ method: 'GET', url: '/v1/products/123asdasdsa' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ sku: '123asdasdsa' });
  });
});

describe('GET /v1/services/:slug', () => {
  it('returns a public service', async () => {
    app = await build([cardiology]);
    const response = await app.inject({ method: 'GET', url: '/v1/services/cardiology' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      slug: 'cardiology',
      enquiryEnabled: true,
      checkoutEnabled: false,
      displayPrice: null,
      listPriceMinor: null,
    });
  });

  it('404s the withdrawn service rather than rendering it', async () => {
    app = await build([withdrawn]);
    const response = await app.inject({ method: 'GET', url: '/v1/services/travel-vaccinations' });
    expect(response.statusCode).toBe(404);
  });

  it('404s the production test service', async () => {
    app = await build([{ ...cardiology, slug: 'university-of-swabi' }]);
    const response = await app.inject({ method: 'GET', url: '/v1/services/university-of-swabi' });
    expect(response.statusCode).toBe(404);
  });
});
