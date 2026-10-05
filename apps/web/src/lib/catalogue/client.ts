import 'server-only';

import {
  PublicProductSchema,
  PublicServiceSchema,
  type PublicProduct,
  type PublicService,
} from '@cera/contracts/projections';

import { fixturePublicServices } from '../catalogue-fixtures.ts';

import { resolveCatalogueApiBaseUrl } from './api-base-url.ts';

/**
 * Server-side catalogue reads through `apps/api`, never Vendure.
 *
 * Falls back to the homepage fixture list when the API is down, so a Vendure
 * restart degrades to cached copy rather than a blank services grid (WP-07.6).
 */

export function apiUrl(): string {
  return resolveCatalogueApiBaseUrl();
}

const DEFAULT_CATALOGUE_REVALIDATE_SECONDS = 60;
const INDEXABLE_CATALOGUE_REVALIDATE_SECONDS = 30;

interface CatalogueFetchOptions {
  readonly revalidateSeconds?: number;
}

function catalogueFetchInit(tags: string[], options?: CatalogueFetchOptions) {
  return {
    next: {
      revalidate: options?.revalidateSeconds ?? DEFAULT_CATALOGUE_REVALIDATE_SECONDS,
      tags: [...tags],
    },
  };
}

export async function listPublicServices(
  query = '',
  options?: CatalogueFetchOptions,
): Promise<{
  readonly items: readonly PublicService[];
  readonly degraded: boolean;
}> {
  try {
    const url = new URL(`${apiUrl().replace(/\/$/, '')}/v1/services`);
    if (query.length > 0) url.search = query.replace(/^\?/, '');
    const response = await fetch(url, catalogueFetchInit(['catalogue'], options));
    if (!response.ok) return { items: fixtureServices(), degraded: true };
    const body = (await response.json()) as { items?: unknown };
    const items = Array.isArray(body.items)
      ? body.items
          .map((item) => PublicServiceSchema.safeParse(item))
          .filter((result) => result.success)
          .map((result) => result.data)
      : [];
    return { items, degraded: false };
  } catch {
    return { items: fixtureServices(), degraded: true };
  }
}

export async function getPublicService(slug: string): Promise<PublicService | null | 'gone'> {
  if (slug === 'travel-vaccinations') return 'gone';

  try {
    const url = `${apiUrl().replace(/\/$/, '')}/v1/services/${encodeURIComponent(slug)}`;
    const response = await fetch(url, { next: { revalidate: 60, tags: [`catalogue:${slug}`] } });
    if (response.status === 404) return null;
    if (!response.ok) {
      return fixtureServices().find((service) => service.slug === slug) ?? null;
    }
    const parsed = PublicServiceSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return fixtureServices().find((service) => service.slug === slug) ?? null;
  }
}

function fixtureServices(): PublicService[] {
  return fixturePublicServices();
}

export async function listPublicProducts(options?: CatalogueFetchOptions): Promise<{
  readonly items: readonly PublicProduct[];
  readonly degraded: boolean;
}> {
  try {
    const url = `${apiUrl().replace(/\/$/, '')}/v1/products`;
    const response = await fetch(
      url,
      catalogueFetchInit(['catalogue', 'catalogue:products'], options),
    );
    if (!response.ok) return { items: [], degraded: true };
    const body = (await response.json()) as { items?: unknown };
    const items = Array.isArray(body.items)
      ? body.items
          .map((item) => PublicProductSchema.safeParse(item))
          .filter((result) => result.success)
          .map((result) => result.data)
      : [];
    return { items, degraded: false };
  } catch {
    return { items: [], degraded: true };
  }
}

export async function getPublicProduct(sku: string): Promise<PublicProduct | null> {
  const normalized = sku.trim();
  if (normalized.length === 0) return null;
  try {
    const url = `${apiUrl().replace(/\/$/, '')}/v1/products/${encodeURIComponent(normalized)}`;
    const response = await fetch(
      url,
      catalogueFetchInit([`catalogue:product:${normalized.toLowerCase()}`, 'catalogue:products']),
    );
    if (response.status === 404) return null;
    if (!response.ok) return null;
    const parsed = PublicProductSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/** Catalogue services for sitemap / indexable routes (fresher cache). */
export async function listPublicServicesForIndex(): Promise<{
  readonly items: readonly PublicService[];
  readonly degraded: boolean;
}> {
  return listPublicServices('', { revalidateSeconds: INDEXABLE_CATALOGUE_REVALIDATE_SECONDS });
}
