import { type ContentDocument, ContentDocumentSchema } from '../entities.ts';
import { type ContentType, ContentTypeSchema } from '../enums.ts';

import { at, days, uuid } from './deterministic.ts';
import { identityByKey } from './identities.ts';
import { fixture, type Fixture } from './marker.ts';

/**
 * Published content, plus one draft of every type.
 *
 * Owned by Payload in production. The draft of each type is the important half:
 * "drafts are not publicly readable" is a rule that is easy to write and easy to
 * get wrong in exactly one place - a sitemap query that forgets the status filter,
 * a search index that reads the latest version instead of the published one - and
 * a fixture set with no drafts in it cannot catch any of those.
 *
 * `ContentTypeSchema.options` is asserted against the draft set, so adding a
 * content type fails the fixture test until it has a draft and therefore a
 * leak test.
 */

const EDITOR = identityByKey('content-editor').subjectId;
const APPROVER = identityByKey('content-approver').subjectId;

/**
 * A minimal Lexical document.
 *
 * Structure is Payload's to own and validate, which is why `ContentDocument.body`
 * is `z.unknown()`. This produces just enough of a real tree that a renderer can
 * be exercised: re-modelling the full AST here would create a second definition
 * to keep in step with Payload's for no benefit.
 */
function lexical(paragraphs: readonly string[]): unknown {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      children: paragraphs.map((text) => ({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          { type: 'text', detail: 0, format: 0, mode: 'normal', style: '', text, version: 1 },
        ],
      })),
    },
  };
}

interface ContentSeed {
  key: string;
  type: ContentType;
  slug: string;
  title: string;
  excerpt: string | null;
  paragraphs: readonly string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  noIndex?: boolean;
  /** Days before the epoch the document was created. */
  createdDaysAgo: number;
}

function published(seed: ContentSeed): Fixture<ContentDocument> {
  const createdAt = at(-days(seed.createdDaysAgo));

  return fixture(
    ContentDocumentSchema.parse({
      id: uuid(`content-${seed.key}`, createdAt),
      type: seed.type,
      slug: seed.slug,
      title: seed.title,
      excerpt: seed.excerpt,
      body: lexical(seed.paragraphs),
      seo: {
        title: seed.seoTitle ?? `${seed.title} | CERA Medical`,
        description: seed.seoDescription ?? seed.excerpt,
        canonicalUrl: null,
        ogImageId: uuid(`content-og-${seed.key}`, createdAt),
        noIndex: seed.noIndex ?? false,
      },
      mediaIds: [uuid(`content-hero-${seed.key}`, createdAt)],
      status: 'published',
      // Authored and approved by different people. A published document where both
      // are the same subject is the state the two-person content rule exists to
      // prevent, so no published fixture models it.
      authorId: EDITOR,
      approverId: APPROVER,
      publishedAt: at(-days(seed.createdDaysAgo - 1)),
      createdAt,
      updatedAt: at(-days(seed.createdDaysAgo - 1)),
    }),
  );
}

/**
 * A draft.
 *
 * `approverId` and `publishedAt` are null, which is what makes it a draft in
 * substance rather than only by its `status` column. A fixture that set
 * `status: 'draft'` while carrying a `publishedAt` would let a query that filters
 * on the wrong one of the two pass.
 */
function draft(seed: ContentSeed): Fixture<ContentDocument> {
  const createdAt = at(-days(seed.createdDaysAgo));

  return fixture(
    ContentDocumentSchema.parse({
      id: uuid(`content-${seed.key}`, createdAt),
      type: seed.type,
      slug: seed.slug,
      title: seed.title,
      excerpt: seed.excerpt,
      body: lexical(seed.paragraphs),
      seo: {
        title: `${seed.title} | CERA Medical`,
        description: seed.seoDescription ?? seed.excerpt,
        canonicalUrl: null,
        ogImageId: null,
        noIndex: false,
      },
      mediaIds: [],
      status: 'draft',
      authorId: EDITOR,
      approverId: null,
      publishedAt: null,
      createdAt,
      updatedAt: createdAt,
    }),
  );
}

// ---------------------------------------------------------------------------
// Three articles, verbatim from the reference image
// ---------------------------------------------------------------------------

export const articleFixtures: readonly Fixture<ContentDocument>[] = [
  published({
    key: 'post-healthy-habits',
    type: 'post',
    slug: '5-simple-habits-for-a-healthier-you',
    title: '5 Simple Habits for a Healthier You',
    excerpt: 'Small changes can make a big difference to your long-term health.',
    paragraphs: [
      'Small changes can make a big difference to your long-term health. None of the five habits below requires a gym membership or a new diet, and each one is something you can start this week.',
      'Sleep first. Adults who consistently sleep between seven and nine hours report fewer coughs and colds, recover faster from exercise, and make better decisions about food later in the day.',
      'Walk after eating. Ten minutes on your feet after a meal does more for blood sugar than the same ten minutes earlier in the day.',
    ],
    createdDaysAgo: 30,
  }),
  published({
    key: 'post-nutrition',
    type: 'post',
    slug: 'the-role-of-nutrition-in-wellbeing',
    title: 'The Role of Nutrition in Wellbeing',
    excerpt: 'Discover how the right diet can support your physical and mental health.',
    paragraphs: [
      'Discover how the right diet can support your physical and mental health. Nutrition is not only about weight, and treating it that way misses most of what food does.',
      'Fibre feeds the bacteria in your gut, and those bacteria produce compounds your brain uses. A diet of thirty different plants a week is a more useful target than a calorie count.',
    ],
    createdDaysAgo: 21,
  }),
  published({
    key: 'post-heart-health',
    type: 'post',
    slug: 'understanding-heart-health',
    title: 'Understanding Heart Health',
    excerpt: 'Learn about key risk factors and how to keep your heart healthy.',
    paragraphs: [
      'Learn about key risk factors and how to keep your heart healthy. Most of what raises cardiovascular risk is measurable, and most of it responds to change.',
      'Blood pressure is the single most useful number to know. It has no symptoms until it has done damage, which is why it is worth checking even when you feel well.',
    ],
    createdDaysAgo: 14,
  }),
];

// ---------------------------------------------------------------------------
// One page, two policies, one service presentation
// ---------------------------------------------------------------------------

export const pageFixture: Fixture<ContentDocument> = published({
  key: 'page-about',
  type: 'page',
  slug: 'about',
  title: 'About CERA Medical',
  excerpt: 'Who we are, and how we decide what to publish.',
  paragraphs: [
    'CERA Medical exists to make it easier to find the right care and to ask a clear question about it. We publish information, we answer enquiries, and we do not diagnose or treat online.',
    'Every clinical page we publish is reviewed by a second clinician before it goes live, and the date of that review is shown on the page.',
  ],
  createdDaysAgo: 120,
});

export const policyFixtures: readonly Fixture<ContentDocument>[] = [
  published({
    key: 'policy-privacy',
    type: 'policy',
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    excerpt: 'What we collect when you make an enquiry, why, and how long we keep it.',
    paragraphs: [
      'When you make an enquiry we collect your name, email address, an optional phone number, the service you asked about, and your message. We record the moment you gave consent to be contacted.',
      'We do not ask for clinical information through this website and you should not send any. If you include it, we will handle it under this policy, but the enquiry form is not a secure clinical channel.',
      'Enquiries are retained for twenty-four months from the date they are closed, after which the personal fields are redacted and only the status history is kept.',
    ],
    createdDaysAgo: 120,
  }),
  published({
    key: 'policy-terms',
    type: 'policy',
    slug: 'terms-of-service',
    title: 'Terms of Service',
    excerpt: 'The terms on which this website and the enquiry service are provided.',
    paragraphs: [
      'This website provides information and an enquiry service. It does not provide diagnosis, treatment, or emergency care. If you need urgent help, contact your local emergency service.',
      'Prices shown are indicative and are confirmed in writing before any appointment is arranged. No payment is taken through this website.',
    ],
    createdDaysAgo: 120,
  }),
];

export const servicePresentationFixture: Fixture<ContentDocument> = published({
  key: 'presentation-cardiology',
  type: 'servicePresentation',
  slug: 'cardiology',
  title: 'Cardiology at CERA Medical',
  excerpt: 'What to expect from a cardiology consultation.',
  paragraphs: [
    'A first cardiology appointment usually lasts forty minutes. You will be asked about your symptoms, your family history, and any medication you take.',
    'Most people have an ECG at the same visit. If further imaging is needed, it is arranged before you leave.',
  ],
  createdDaysAgo: 60,
});

// ---------------------------------------------------------------------------
// One draft of every type
// ---------------------------------------------------------------------------

/**
 * Every one of these must be invisible to the public site.
 *
 * Their titles say so out loud. If one of these strings ever appears in a
 * rendered page, a sitemap, an RSS feed, or a search result, the failure is
 * obvious at a glance rather than requiring someone to look up whether that
 * document was supposed to be live.
 */
export const draftFixtures: readonly Fixture<ContentDocument>[] = [
  draft({
    key: 'draft-post',
    type: 'post',
    slug: 'draft-sleep-and-recovery',
    title: 'DRAFT Sleep and Recovery (must not be public)',
    excerpt: 'An unapproved article. Must never appear in a listing or a feed.',
    paragraphs: ['Unapproved body text. This paragraph must never reach a public response.'],
    createdDaysAgo: 3,
  }),
  draft({
    key: 'draft-page',
    type: 'page',
    slug: 'draft-careers',
    title: 'DRAFT Careers (must not be public)',
    excerpt: 'An unapproved page. Must 404 for an unauthenticated visitor.',
    paragraphs: ['Unapproved body text. This paragraph must never reach a public response.'],
    createdDaysAgo: 2,
  }),
  draft({
    key: 'draft-policy',
    type: 'policy',
    slug: 'draft-cookie-policy',
    title: 'DRAFT Cookie Policy (must not be public)',
    excerpt: 'An unapproved policy. A published policy must not be replaced by it.',
    paragraphs: ['Unapproved body text. This paragraph must never reach a public response.'],
    createdDaysAgo: 1,
  }),
  draft({
    key: 'draft-presentation',
    type: 'servicePresentation',
    slug: 'draft-orthopaedics',
    title: 'DRAFT Orthopaedics presentation (must not be public)',
    excerpt: 'An unapproved presentation. The service page must render without it.',
    paragraphs: ['Unapproved body text. This paragraph must never reach a public response.'],
    createdDaysAgo: 1,
  }),
];

/** Everything a public reader may see. */
export const publishedContentFixtures: readonly Fixture<ContentDocument>[] = [
  ...articleFixtures,
  pageFixture,
  ...policyFixtures,
  servicePresentationFixture,
];

/** Every content document, published and draft. */
export const contentFixtures: readonly Fixture<ContentDocument>[] = [
  ...publishedContentFixtures,
  ...draftFixtures,
];

/** Asserted by the fixture tests: every content type has a draft. */
export const ALL_CONTENT_TYPES: readonly ContentType[] = ContentTypeSchema.options;

/**
 * Strings that must never appear in a public response.
 *
 * Collected here so the leak test in WP-02.5 has one list to check rather than
 * reaching into each draft, and so a new draft is covered automatically.
 */
export const DRAFT_ONLY_STRINGS: readonly string[] = draftFixtures.flatMap((document) => [
  document.title,
  document.slug,
  ...(document.excerpt === null ? [] : [document.excerpt]),
]);
