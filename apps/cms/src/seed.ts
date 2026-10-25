/**
 * Seeds local editor accounts and fixture documents for development. Fixture content is excluded from public reads.
 *
 * Run against an empty `cera_cms` after migrate. Re-running updates by slug
 * rather than duplicating, so a local reset is `seed` again rather than a
 * drop. Production refuses to run: a seed that inserts "DRAFT ... must not be
 * public" into a live CMS is a content incident.
 */

import { getPayload } from 'payload';

import { bootstrapClientContent } from './lib/bootstrap-content.ts';
import config from './payload.config.ts';

const PENDING = 'Pending CERA content approval.';
const LEGACY_TECHNICAL_POSTS = [
  'planning-metagenomic-submissions',
  'omics-quality-control-basics',
  'preclinical-study-handoff',
  'confocal-imaging-in-the-laboratory',
  'plate-based-assays-and-readout',
  'documenting-laboratory-methods',
] as const;

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
      _status: 'draft' as const,
    };
    if (found.docs[0] === undefined) {
      await payload.create({ collection: 'posts', data, overrideAccess: true, draft: true });
    } else if (found.docs[0].fixture === true && found.docs[0]._status !== 'draft') {
      // These local sample articles are unapproved. Keep their content while
      // withdrawing any version published by an earlier seed run.
      await payload.update({
        collection: 'posts',
        id: found.docs[0].id,
        data: { _status: 'draft' },
        overrideAccess: true,
        draft: true,
      });
    }
  }

  const projects = [
    {
      slug: 'methamphetamine-induced-neurotoxicity',
      title: 'Methamphetamine-induced neurotoxicity',
      category: 'preclinical-studies',
      projectStatus: 'running',
      featured: true,
      summary:
        'A mouse model of methamphetamine exposure in which a natural compound is tested for protective and restorative effects on recognition memory, neuroinflammation and neuronal cell death.',
    },
    {
      slug: 'social-isolation-stress',
      title: 'Social isolation stress',
      category: 'preclinical-studies',
      projectStatus: 'running',
      featured: false,
      summary:
        'The effect of early-life social isolation on the brain and on behaviour, including vulnerability to drug dependence in later life.',
    },
    {
      slug: 'morphine-dependence',
      title: 'Morphine dependence',
      category: 'preclinical-studies',
      projectStatus: 'running',
      featured: false,
      summary:
        'Mouse models of morphine dependence and withdrawal, used to test candidate treatments and the signalling pathways through which they act.',
    },
    {
      slug: 'nicotine',
      title: 'Nicotine',
      category: 'preclinical-studies',
      projectStatus: 'running',
      featured: false,
      summary:
        'Rodent models of nicotine exposure, in which candidate products are evaluated for their neuroprotective and behavioural effects.',
    },
    {
      slug: 'synthetic-compounds-in-neuroscience',
      title: 'Synthetic compounds in neuroscience',
      category: 'preclinical-studies',
      projectStatus: 'running',
      featured: false,
      summary:
        'Newly synthesised compounds, and compounds modified from a base compound, screened for activity in neurological and behavioural models.',
    },
    {
      slug: 'gut-induced-depression',
      title: 'Gut-induced depression',
      category: 'preclinical-studies',
      projectStatus: 'running',
      featured: false,
      summary:
        'Models in which disturbance of the gut microbiota produces depression-like behaviour, used to study the gut-brain axis and to test interventions.',
    },
    {
      slug: 'natural-products-in-glioblastoma',
      title: 'Natural products in glioblastoma',
      category: 'preclinical-studies',
      projectStatus: 'running',
      featured: true,
      summary:
        'Natural products tested against glioblastoma cell lines for their effect on cell viability and proliferation.',
    },
    {
      slug: 'in-silico-target-studies',
      title: 'In silico target studies',
      category: 'preclinical-studies',
      projectStatus: 'running',
      featured: false,
      summary:
        'Docking and molecular dynamics studies that test whether a compound under investigation binds the inflammatory and cell-death proteins implicated by our animal studies.',
    },
    {
      slug: 'infant-gut-microbiome-development',
      title: 'Infant gut microbiome development',
      category: 'biomedical-data-analysis',
      projectStatus: 'completed',
      featured: true,
      summary:
        'A longitudinal shotgun metagenomic study of infants in a population-based birth cohort in Pakistan, sampled from birth to twelve months and analysed by both genome-resolved and read-based routes, with a data descriptor manuscript and deposition of the raw reads in NCBI SRA.',
    },
    {
      slug: 'mother-and-infant-gut-microbiome',
      title: 'Mother and infant gut microbiome',
      category: 'biomedical-data-analysis',
      projectStatus: 'completed',
      featured: false,
      summary:
        'Species-level profiling of a longitudinal mother-infant cohort, published in a peer-reviewed nutrition journal.',
    },
    {
      slug: 'oral-microbiome-of-pre-school-children',
      title: 'Oral microbiome of pre-school children',
      category: 'biomedical-data-analysis',
      projectStatus: 'completed',
      featured: false,
      summary:
        'A 16S rRNA amplicon study of the salivary microbiome of Pakistani pre-school children, including a comparison of stunted and normal-weight children.',
    },
  ] as const;

  for (const project of projects) {
    const found = await payload.find({
      collection: 'projects',
      where: { slug: { equals: project.slug } },
      limit: 1,
    });
    if (found.docs[0] === undefined) {
      await payload.create({
        collection: 'projects',
        data: { ...project, _status: 'published' },
        overrideAccess: true,
        draft: false,
      });
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
        { label: 'Products', href: '/products' },
        { label: 'Our Projects', href: '/projects' },
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
      email: 'contact@ceramedical.org',
      phone: '',
      address:
        '2nd Floor, BIC, C2 Building, Pak-Austria Fachhochschule: Institute of Applied Sciences and Technology (PAF-IAST), Mang, Haripur, Pakistan',
      social: [],
      newsletterHeading: '',
      newsletterBody: '',
    },
    overrideAccess: true,
  });

  await bootstrapClientContent(payload);

  for (const slug of LEGACY_TECHNICAL_POSTS) {
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
      draft: true,
      overrideAccess: true,
    });
    const post = existing.docs[0];
    if (post !== undefined && post._status !== 'draft') {
      // Preserve the record and body; the legacy articles are retained for
      // editor review but must no longer be public fixtures.
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: { _status: 'draft' },
        overrideAccess: true,
        draft: true,
      });
    }
  }

  payload.logger.info('CMS seed complete. Approver login: approver@cera.localhost');
  await payload.destroy();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
