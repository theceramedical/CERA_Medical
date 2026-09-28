/**
 * Whether a ServicePresentation may point at a catalogue record.
 *
 * Marketing copy lives in the CMS; the catalogue record (price, availability,
 * enquiryEnabled) stays authoritative in Vendure. A presentation that points at a
 * service that does not exist, or at one that has been withdrawn, would publish a
 * page whose "Make an Enquiry" button 404s or submits against nothing.
 *
 * Phase 06 swaps the lookup for a live Shop API call. Until then the six
 * reference-image slugs are the allow-list - the same six the homepage cards
 * already link to. `travel-vaccinations` is deliberately absent: it is the
 * withdrawn fixture, and a presentation for it must not save.
 */

export const REFERENCE_SERVICE_SLUGS = [
  'general-health',
  'cardiology',
  'orthopaedics',
  'womens-health',
  'diagnostic-tests',
  'wellness-preventive-care',
] as const;

export type ReferenceServiceSlug = (typeof REFERENCE_SERVICE_SLUGS)[number];

export class UnknownServiceError extends Error {
  constructor(slug: string) {
    super(
      `No active catalogue service has slug "${slug}". A presentation cannot point at a service that does not exist.`,
    );
    this.name = 'UnknownServiceError';
  }
}

export class CatalogueUnavailableError extends Error {
  constructor() {
    super(
      'The service catalogue is unavailable. A presentation cannot be saved without a live check.',
    );
    this.name = 'CatalogueUnavailableError';
  }
}

export async function assertServiceExists(
  slug: string,
  lookup: (candidate: string) => Promise<boolean> | boolean = defaultLookup,
): Promise<void> {
  const exists = await lookup(slug);
  if (!exists) throw new UnknownServiceError(slug);
}

function defaultLookup(slug: string): boolean {
  return (REFERENCE_SERVICE_SLUGS as readonly string[]).includes(slug);
}

/**
 * Optional live lookup against Vendure's Shop API.
 *
 * Returns `null` only when the request fails. The caller treats `null` as
 * fail-closed: a down catalogue cannot be used to save a presentation that
 * might point at a withdrawn service.
 */
export async function vendureHasSlug(shopApiUrl: string, slug: string): Promise<boolean | null> {
  try {
    const response = await fetch(shopApiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: 'query ($slug: String!) { product(slug: $slug) { id slug } }',
        variables: { slug },
      }),
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { data?: { product?: { slug?: string } | null } };
    return body.data?.product?.slug === slug;
  } catch {
    return null;
  }
}
