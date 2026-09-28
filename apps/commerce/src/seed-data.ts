/**
 * The six reference services plus the withdrawn seventh.
 *
 * Titles and summaries are the reference image's copy, matching
 * `packages/contracts/src/fixtures/services.ts` so the homepage and the
 * catalogue cannot drift. Two exclusion paths are explicit:
 *
 * - `diagnostic-tests` is active with `enquiryEnabled: false` (browsable, no form)
 * - `travel-vaccinations` is disabled (must not appear in any public listing)
 */

export interface SeedCollection {
  readonly slug: string;
  readonly name: string;
}

export interface SeedService {
  readonly slug: string;
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  readonly collectionSlug: string;
  readonly displayPriceText: string | null;
  readonly availabilityText: string | null;
  readonly enquiryEnabled: boolean;
  readonly enabled: boolean;
  readonly internalNotes: string | null;
}

export const SEED_COLLECTIONS: readonly SeedCollection[] = [
  { slug: 'primary-care', name: 'Primary Care' },
  { slug: 'specialist', name: 'Specialist Care' },
  { slug: 'diagnostics', name: 'Diagnostics' },
];

export const SEED_SERVICES: readonly SeedService[] = [
  {
    slug: 'general-health',
    name: 'General Health',
    summary: 'Comprehensive care for everyday health needs.',
    description:
      'Comprehensive care for everyday health needs. General Health at CERA Medical is delivered by consultants who explain your options in plain language, so you can decide what happens next with confidence.',
    collectionSlug: 'primary-care',
    displayPriceText: 'From £95',
    availabilityText: 'Usually within 3 working days',
    enquiryEnabled: true,
    enabled: true,
    internalNotes: 'FIXTURE internal note — must never appear in Shop API or public projection.',
  },
  {
    slug: 'cardiology',
    name: 'Cardiology',
    summary: 'Expert care for a healthier heart.',
    description:
      'Expert care for a healthier heart. Cardiology at CERA Medical is delivered by consultants who explain your options in plain language, so you can decide what happens next with confidence.',
    collectionSlug: 'specialist',
    displayPriceText: 'From £250',
    availabilityText: 'Usually within 2 weeks',
    enquiryEnabled: true,
    enabled: true,
    internalNotes: 'FIXTURE internal note — must never appear in Shop API or public projection.',
  },
  {
    slug: 'orthopaedics',
    name: 'Orthopaedics',
    summary: 'Getting you moving with confidence.',
    description:
      'Getting you moving with confidence. Orthopaedics at CERA Medical is delivered by consultants who explain your options in plain language, so you can decide what happens next with confidence.',
    collectionSlug: 'specialist',
    displayPriceText: 'From £220',
    availabilityText: 'Usually within 2 weeks',
    enquiryEnabled: true,
    enabled: true,
    internalNotes: 'FIXTURE internal note — must never appear in Shop API or public projection.',
  },
  {
    slug: 'womens-health',
    name: "Women's Health",
    summary: 'Specialist care for every stage of life.',
    description:
      "Specialist care for every stage of life. Women's Health at CERA Medical is delivered by consultants who explain your options in plain language, so you can decide what happens next with confidence.",
    collectionSlug: 'specialist',
    displayPriceText: null,
    availabilityText: 'Usually within 1 week',
    enquiryEnabled: true,
    enabled: true,
    internalNotes: 'FIXTURE internal note — must never appear in Shop API or public projection.',
  },
  {
    slug: 'diagnostic-tests',
    name: 'Diagnostic Tests',
    summary: 'Accurate results for better care.',
    description:
      'Accurate results for better care. Diagnostic Tests at CERA Medical is delivered by consultants who explain your options in plain language, so you can decide what happens next with confidence.',
    collectionSlug: 'diagnostics',
    displayPriceText: 'From £60',
    availabilityText: 'By referral only',
    enquiryEnabled: false,
    enabled: true,
    internalNotes: 'FIXTURE internal note — must never appear in Shop API or public projection.',
  },
  {
    slug: 'wellness-preventive-care',
    name: 'Wellness & Preventive Care',
    summary: 'Stay healthy today and tomorrow.',
    description:
      'Stay healthy today and tomorrow. Wellness & Preventive Care at CERA Medical is delivered by consultants who explain your options in plain language, so you can decide what happens next with confidence.',
    collectionSlug: 'primary-care',
    displayPriceText: null,
    availabilityText: null,
    enquiryEnabled: true,
    enabled: true,
    internalNotes: 'FIXTURE internal note — must never appear in Shop API or public projection.',
  },
  {
    slug: 'travel-vaccinations',
    name: 'Travel Vaccinations',
    summary: 'No longer offered.',
    description: 'Withdrawn. Must not appear in any listing, sitemap entry, or service picker.',
    collectionSlug: 'primary-care',
    displayPriceText: null,
    availabilityText: null,
    enquiryEnabled: false,
    enabled: false,
    internalNotes: 'Withdrawn fixture. Must 404 publicly.',
  },
];
