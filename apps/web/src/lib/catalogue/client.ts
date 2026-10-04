import 'server-only';

import { PublicServiceSchema, type PublicService } from '@cera/contracts/projections';

import { fixturePublicServices } from '../catalogue-fixtures.ts';

/**
 * Server-side catalogue reads through `apps/api`, never Vendure.
 *
 * Falls back to the homepage fixture list when the API is down, so a Vendure
 * restart degrades to cached copy rather than a blank services grid (WP-07.6).
 */

export function apiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3003';
}

export async function listPublicServices(query = ''): Promise<{
  readonly items: readonly PublicService[];
  readonly degraded: boolean;
}> {
  try {
    const url = new URL(`${apiUrl().replace(/\/$/, '')}/v1/services`);
    if (query.length > 0) url.search = query.replace(/^\?/, '');
    const response = await fetch(url, { next: { revalidate: 60, tags: ['catalogue'] } });
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
