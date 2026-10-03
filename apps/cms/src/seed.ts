/**
 * Seeds local editor accounts and fixture documents for development. Fixture content is excluded from public reads.
 *
 * Run against an empty `cera_cms` after migrate. Re-running updates by slug
 * rather than duplicating, so a local reset is `seed` again rather than a
 * drop. Production refuses to run: a seed that inserts "DRAFT ... must not be
 * public" into a live CMS is a content incident.
 */

import { getPayload } from 'payload';

import config from './payload.config.ts';

const PENDING = 'Pending CERA content approval.';

function lexical(paragraphs: readonly string[]) {
  return {
    root: {
      type: 'root',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
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

async function main(): Promise<void> {
  if (process.env.CERA_ENV === 'production' || process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed the CMS in production.');
  }

  const payload = await getPayload({ config });

  const adminEmail = 'approver@cera.localhost';
  const editorEmail = 'editor@cera.localhost';
  const password = process.env.CMS_SEED_PASSWORD ?? 'local-only-change-me';

  const existingAdmin = await payload.find({
    collection: 'users',
    where: { email: { equals: adminEmail } },
    limit: 1,
  });
  if (existingAdmin.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { email: adminEmail, password, role: 'content_approver' },
      overrideAccess: true,
    });
  }

  const existingEditor = await payload.find({
    collection: 'users',
    where: { email: { equals: editorEmail } },
    limit: 1,
  });
  if (existingEditor.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { email: editorEmail, password, role: 'content_editor' },
      overrideAccess: true,
    });
  }

  const categories = [
    { title: 'WELLNESS', slug: 'wellness', colourToken: 'accent-fill' },
    { title: 'NUTRITION', slug: 'nutrition', colourToken: 'accent-fill' },
    { title: 'HEART HEALTH', slug: 'heart-health', colourToken: 'accent-fill' },
  ] as const;

  const categoryIds: Record<string, number> = {};
  for (const category of categories) {
    const found = await payload.find({
      collection: 'categories',
      where: { slug: { equals: category.slug } },
      limit: 1,
    });
    const doc =
      found.docs[0] ??
      (await payload.create({
        collection: 'categories',
        data: { ...category },
      }));
    if (typeof doc.id !== 'number') {
      throw new Error(`Expected a numeric category ID for ${category.slug}`);
    }
    categoryIds[category.slug] = doc.id;
  }
  const categoryId = (slug: string): number => {
    const id = categoryIds[slug];
    if (id === undefined) throw new Error(`Missing seeded category: ${slug}`);
    return id;
  };

  const posts = [
    {
      slug: '5-simple-habits-for-a-healthier-you',
      title: '5 Simple Habits for a Healthier You',
      excerpt: 'Small changes can make a big difference to your long-term health.',
      category: 'wellness',
      paragraphs: [
        PENDING,
        'Small changes can make a big difference to your long-term health. None of the five habits below requires a gym membership or a new diet, and each one is something you can start this week.',
      ],
    },
    {
      slug: 'the-role-of-nutrition-in-wellbeing',
      title: 'The Role of Nutrition in Wellbeing',
      excerpt: 'Discover how the right diet can support your physical and mental health.',
      category: 'nutrition',
      paragraphs: [
        PENDING,
        'Discover how the right diet can support your physical and mental health.',
      ],
    },
    {
      slug: 'understanding-heart-health',
      title: 'Understanding Heart Health',
      excerpt: 'Learn about key risk factors and how to keep your heart healthy.',
      category: 'heart-health',
      paragraphs: [PENDING, 'Learn about key risk factors and how to keep your heart healthy.'],
    },
  ];

  for (const post of posts) {
    const found = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
    });
    const data = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      category: categoryId(post.category),
      body: lexical(post.paragraphs),
      seo: { title: `${post.title} | CERA Medical`, description: post.excerpt },
      fixture: true,
      _status: 'published' as const,
    };
    if (found.docs[0] === undefined) {
      await payload.create({ collection: 'posts', data, overrideAccess: true, draft: false });
    }
  }

  const about = {
    title: 'About CERA Medical',
    slug: 'about',
    excerpt: 'Who we are, and how we decide what to publish.',
    body: lexical([
      PENDING,
      'CERA Medical exists to make it easier to find the right care and to ask a clear question about it.',
    ]),
    fixture: true,
    _status: 'published' as const,
  };
  const existingAbout = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'about' } },
    limit: 1,
  });
  if (existingAbout.docs[0] === undefined) {
    await payload.create({ collection: 'pages', data: about, overrideAccess: true, draft: false });
  }

  const policies = [
    {
      slug: 'privacy-policy',
      title: 'Privacy Policy',
      excerpt: 'What we collect when you make an enquiry, why, and how long we keep it.',
    },
    {
      slug: 'terms-of-service',
      title: 'Terms of Service',
      excerpt: 'The terms on which this website and the enquiry service are provided.',
    },
  ];
  for (const policy of policies) {
    const found = await payload.find({
      collection: 'policies',
      where: { slug: { equals: policy.slug } },
      limit: 1,
    });
    if (found.docs[0] === undefined) {
      await payload.create({
        collection: 'policies',
        overrideAccess: true,
        draft: false,
        data: {
          ...policy,
          effectiveDate: '2026-01-01',
          versionLabel: 'pending-review',
          body: lexical([PENDING, policy.excerpt]),
          fixture: true,
          _status: 'published',
        },
      });
    }
  }

  const presentation = await payload.find({
    collection: 'service-presentations',
    where: { slug: { equals: 'preclinical-studies' } },
    limit: 1,
  });
  if (presentation.docs[0] === undefined) {
    await payload.create({
      collection: 'service-presentations',
      overrideAccess: true,
      draft: false,
      data: {
        title: 'Preclinical Studies',
        slug: 'preclinical-studies',
        serviceId: 'preclinical-studies',
        excerpt: 'Safety and efficacy testing in animal models, cells and computer simulations.',
        body: lexical([
          'CERA Medical provides in vivo, in vitro and in silico preclinical research services. Scope, protocol, controls, timeline and deliverables are agreed in writing before work begins.',
          'Animal studies begin only after approval of the study protocol by the institutional animal ethics committee.',
        ]),
        fixture: true,
        _status: 'published',
      },
    });
  }

  // One draft of every type. Titles say so out loud so a leak is obvious.
  const drafts = [
    {
      collection: 'posts' as const,
      data: {
        title: 'DRAFT Sleep and Recovery (must not be public)',
        slug: 'draft-sleep-and-recovery',
        excerpt: 'An unapproved article. Must never appear in a listing or a feed.',
        category: categoryId('wellness'),
        body: lexical(['Unapproved body text. This paragraph must never reach a public response.']),
        fixture: true,
        _status: 'draft' as const,
      },
    },
    {
      collection: 'pages' as const,
      data: {
        title: 'DRAFT Careers (must not be public)',
        slug: 'draft-careers',
        excerpt: 'An unapproved page. Must 404 for an unauthenticated visitor.',
        body: lexical(['Unapproved body text. This paragraph must never reach a public response.']),
        fixture: true,
        _status: 'draft' as const,
      },
    },
  ];

  for (const draft of drafts) {
    const found = await payload.find({
      collection: draft.collection,
      where: { slug: { equals: draft.data.slug } },
      limit: 1,
      draft: true,
    });
    if (found.docs[0] === undefined) {
      if ('category' in draft.data) {
        await payload.create({
          collection: 'posts',
          data: draft.data,
          overrideAccess: true,
          draft: true,
        });
      } else {
        await payload.create({
          collection: 'pages',
          data: draft.data,
          overrideAccess: true,
          draft: true,
        });
      }
    }
  }

  await payload.updateGlobal({
    slug: 'navigation',
    data: {
      header: [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/services' },
        { label: 'Research Updates', href: '/articles' },
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
      ],
    },
    overrideAccess: true,
  });

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      tagline: 'Biomedical Research and Development',
      email: 'theceramedica@gmail.com',
      phone: '',
      address:
        '2nd Floor, BIC, C2 Building, Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology (PAF-IAST), Mang, Haripur, Pakistan',
      social: [],
      newsletterHeading: '',
      newsletterBody: '',
    },
    overrideAccess: true,
  });

  payload.logger.info('CMS seed complete. Approver login: approver@cera.localhost');
  await payload.destroy();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
