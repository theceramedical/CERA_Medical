import { type Service, ServiceSchema } from '../entities.ts';

import { at, days, uuid } from './deterministic.ts';
import { fixture, type Fixture } from './marker.ts';

/**
 * The six services from the reference image, plus a seventh that proves withdrawal.
 *
 * Owned by Vendure in production; these exist so `apps/web` and `apps/api` can be
 * built and tested before the catalogue exists (PRD 16.1). Titles and summaries
 * are the reference image's copy verbatim, so the homepage fixture render and the
 * design review are looking at the same words.
 *
 * Two records are deliberately not enquirable, so the exclusion logic has data
 * behind it rather than a branch nobody exercises:
 *
 * - `diagnostic-tests` has `enquiryEnabled: false`, covering "this service exists
 *   and is browsable but its enquiry form must not render".
 * - `travel-vaccinations` is `inactive`, covering "excluded from listings entirely,
 *   and its page 404s".
 *
 * **The inactive one is a seventh record rather than one of the reference's six, and
 * that is the correction to an earlier mistake worth recording.** It was originally
 * `wellness-preventive-care`, which was cheap - no new fixture - and wrong: the
 * reference image shows all six services on the homepage, so marking one of them
 * withdrawn made Phase 04's homepage link to a page that must 404. The conflict only
 * surfaced because `apps/web/src/content/homepage.test.ts` asserts the homepage copy
 * and these fixtures name the same services. A withdrawn service is a record the
 * business used to offer; it is not one of the six it currently advertises, and the
 * fixture set should say so.
 */

const SERVICE_CREATED_AT = at(-days(90));

interface ServiceSeed {
  key: string;
  slug: string;
  title: string;
  summary: string;
  category: { key: string; slug: string; title: string } | null;
  displayPrice: string | null;
  availabilityText: string | null;
  enquiryEnabled: boolean;
  status: Service['status'];
}

const PRIMARY_CARE = { key: 'primary-care', slug: 'primary-care', title: 'Primary Care' };
const SPECIALIST = { key: 'specialist', slug: 'specialist', title: 'Specialist Care' };
const DIAGNOSTICS = { key: 'diagnostics', slug: 'diagnostics', title: 'Diagnostics' };

const SERVICE_SEEDS: readonly ServiceSeed[] = [
  {
    key: 'general-health',
    slug: 'general-health',
    title: 'General Health',
    summary: 'Comprehensive care for everyday health needs.',
    category: PRIMARY_CARE,
    // Presentational text, never a number. The schema's type is what keeps a
    // payment path from forming; the fixture respects it rather than sneaking a
    // parseable value in through the back door.
    displayPrice: 'From £95',
    availabilityText: 'Usually within 3 working days',
    enquiryEnabled: true,
    status: 'active',
  },
  {
    key: 'cardiology',
    slug: 'cardiology',
    title: 'Cardiology',
    summary: 'Expert care for a healthier heart.',
    category: SPECIALIST,
    displayPrice: 'From £250',
    availabilityText: 'Usually within 2 weeks',
    enquiryEnabled: true,
    status: 'active',
  },
  {
    key: 'orthopaedics',
    slug: 'orthopaedics',
    title: 'Orthopaedics',
    summary: 'Getting you moving with confidence.',
    category: SPECIALIST,
    displayPrice: 'From £220',
    availabilityText: 'Usually within 2 weeks',
    enquiryEnabled: true,
    status: 'active',
  },
  {
    key: 'womens-health',
    slug: 'womens-health',
    title: "Women's Health",
    summary: 'Specialist care for every stage of life.',
    category: SPECIALIST,
    // Null rather than omitted: "we do not publish a price for this" is a real
    // state the service card has to render, and a fixture where every service has
    // a price would leave that branch untested.
    displayPrice: null,
    availabilityText: 'Usually within 1 week',
    enquiryEnabled: true,
    status: 'active',
  },
  {
    key: 'diagnostic-tests',
    slug: 'diagnostic-tests',
    title: 'Diagnostic Tests',
    summary: 'Accurate results for better care.',
    category: DIAGNOSTICS,
    displayPrice: 'From £60',
    // Browsable, but enquiries are handled by referral rather than the form.
    availabilityText: 'By referral only',
    enquiryEnabled: false,
    status: 'active',
  },
  {
    key: 'wellness-preventive-care',
    slug: 'wellness-preventive-care',
    title: 'Wellness & Preventive Care',
    summary: 'Stay healthy today and tomorrow.',
    category: PRIMARY_CARE,
    displayPrice: null,
    availabilityText: null,
    enquiryEnabled: true,
    status: 'active',
  },
  {
    key: 'travel-vaccinations',
    slug: 'travel-vaccinations',
    title: 'Travel Vaccinations',
    summary: 'No longer offered.',
    category: PRIMARY_CARE,
    displayPrice: null,
    availabilityText: null,
    // Withdrawn from the catalogue. Must not appear in any listing, sitemap entry,
    // or service picker, and its page must 404 rather than render.
    //
    // Not one of the reference image's six, deliberately - see the docblock. The copy
    // says what it is, so a screenshot that somehow contains this card is obviously wrong.
    enquiryEnabled: false,
    status: 'inactive',
  },
];

function buildService(seed: ServiceSeed): Fixture<Service> {
  return fixture(
    ServiceSchema.parse({
      id: uuid(`service-${seed.key}`, SERVICE_CREATED_AT),
      slug: seed.slug,
      category:
        seed.category === null
          ? null
          : {
              id: uuid(`service-category-${seed.category.key}`, SERVICE_CREATED_AT),
              slug: seed.category.slug,
              title: seed.category.title,
            },
      title: seed.title,
      summary: seed.summary,
      description: `${seed.summary} ${seed.title} at CERA Medical is delivered by consultants who explain your options in plain language, so you can decide what happens next with confidence.`,
      displayPrice: seed.displayPrice,
      availabilityText: seed.availabilityText,
      enquiryEnabled: seed.enquiryEnabled,
      listPriceMinor: null,
      checkoutEnabled: false,
      mediaId: uuid(`service-media-${seed.key}`, SERVICE_CREATED_AT),
      imageUrl: null,
      status: seed.status,
      createdAt: SERVICE_CREATED_AT,
      updatedAt: at(-days(7)),
    }),
  );
}

/** All six, in the order the reference image shows them. */
export const serviceFixtures: readonly Fixture<Service>[] = SERVICE_SEEDS.map(buildService);

/**
 * Lookup by the stable key, so a test names the service it means.
 *
 * `serviceFixtures[4]` in a test is a reference that breaks silently the moment
 * the order changes; `serviceByKey('diagnostic-tests')` says why that service was
 * chosen.
 */
export function serviceByKey(key: string): Fixture<Service> {
  const found = serviceFixtures.find((service) => service.slug === key);

  if (found === undefined) {
    throw new Error(`No service fixture with key "${key}"`);
  }

  return found;
}

/** The services a listing should show: active, whatever their enquiry setting. */
export const listableServiceFixtures: readonly Fixture<Service>[] = serviceFixtures.filter(
  (service) => service.status === 'active',
);

/** The services that may receive an enquiry. Active *and* enquiry-enabled. */
export const enquirableServiceFixtures: readonly Fixture<Service>[] = serviceFixtures.filter(
  (service) => service.status === 'active' && service.enquiryEnabled,
);
