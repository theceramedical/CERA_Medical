import { createServer } from 'node:http';

/** Browser-suite fixture for the web app's server-side API and CMS calls. */

const ISO = '2026-01-01T00:00:00.000Z';

function pageDoc(slug, title, layout) {
  return {
    id: `e2e-page-${slug}`,
    slug,
    title,
    excerpt: `${title} — E2E fixture excerpt.`,
    body: null,
    layout,
    seo: {
      title: `${title} | CERA Medical`,
      description: `${title} for browser test fixtures.`,
      noIndex: false,
    },
    _status: 'published',
    publishedAt: ISO,
    createdAt: ISO,
    updatedAt: ISO,
  };
}

const SECTION = (eyebrow, heading, body) => ({
  blockType: 'sectionHeading',
  eyebrow,
  heading,
  body,
});

const CMS_PAGES = new Map(
  [
    pageDoc('home', 'Home', [
      {
        blockType: 'hero',
        eyebrow: 'Biomedical R&D',
        headlinePrimary: 'Research with',
        headlineAccent: 'documented rigor',
        body: 'Preclinical studies, molecular research, and omics analysis for research teams.',
        primaryHref: '/services',
        primaryLabel: 'Explore Services',
        secondaryHref: '/enquiry',
        secondaryLabel: 'Make an Enquiry',
      },
      {
        blockType: 'ctaBand',
        headline: 'Start a project enquiry',
        body: 'Tell us about your study scope and we will respond within three working days.',
        href: '/enquiry',
        label: 'Make an Enquiry',
      },
    ]),
    pageDoc('services', 'Complete Service Portfolio', [
      SECTION(
        'CLINICAL RESEARCH INFRASTRUCTURE',
        'Complete Service Portfolio',
        'CERA Medical provides biomedical research and development services.',
      ),
      { blockType: 'servicesCatalogue' },
    ]),
    pageDoc('articles', 'Research Updates', [
      SECTION('Insights', 'Research Updates', 'Articles and updates from CERA Medical.'),
    ]),
    pageDoc('about', 'About CERA Medical', [
      SECTION(
        'Our story',
        'About CERA Medical',
        'Biomedical research and development in Haripur, Pakistan.',
      ),
    ]),
    pageDoc('contact', 'Contact', [
      SECTION('Get in touch', 'Contact CERA Medical', 'Email or visit our laboratory and office.'),
    ]),
    pageDoc('enquiry', 'Make an Enquiry', [
      SECTION(
        'Project enquiry',
        'Make an Enquiry',
        'Tell us which service you are interested in and how to reach you.',
      ),
    ]),
    pageDoc('faqs', 'Research Service FAQs', [
      SECTION('Support', 'Research Service FAQs', 'Answers about CERA Medical research services.'),
    ]),
    pageDoc('search', 'Search', [
      SECTION('Find content', 'Search', 'Search services and articles on ceramedical.org.'),
    ]),
    pageDoc('sitemap', 'Sitemap', [
      SECTION('Site map', 'Sitemap', 'Every page on the CERA Medical website.'),
    ]),
  ].map((doc) => [doc.slug, doc]),
);

const SITE_SETTINGS = {
  enquiryForm: {
    consentVersion: 'cera-brief-2026-10-03-v1',
    extraServices: [
      { slug: 'research-collaboration', title: 'Research collaboration' },
      { slug: 'other-enquiry', title: 'Other enquiry' },
    ],
  },
  faqs: [
    {
      question: 'How do I request a quotation?',
      answer: 'Use the enquiry form and select the service line that best matches your project.',
    },
  ],
};

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

function cmsPages(url) {
  const slug = url.searchParams.get('where[slug][equals]');
  if (slug === null) return { docs: [] };
  const doc = CMS_PAGES.get(slug);
  return { docs: doc === undefined ? [] : [doc] };
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', 'http://127.0.0.1');
  const path = url.pathname;

  if (request.method === 'GET' && path === '/health') {
    json(response, 200, { ok: true });
    return;
  }

  if (request.method === 'GET' && path === '/api/globals/site-settings') {
    json(response, 200, SITE_SETTINGS);
    return;
  }

  if (request.method === 'GET' && path === '/api/pages') {
    json(response, 200, cmsPages(url));
    return;
  }

  if (request.method === 'GET' && /^\/api\/(posts|policies|service-presentations)$/.test(path)) {
    json(response, 200, { docs: [] });
    return;
  }

  if (request.method === 'POST' && path === '/v1/enquiries') {
    let raw = '';
    for await (const chunk of request) raw += chunk;
    try {
      const body = JSON.parse(raw);
      if (!body.name || !body.email || !body.message || body.consent !== true) {
        json(response, 400, { error: { message: 'Invalid enquiry.' } });
        return;
      }
      json(response, 201, {
        reference: 'CERA-260928-TEST1',
        submittedAt: new Date().toISOString(),
        message: 'Submitted.',
      });
    } catch {
      json(response, 400, { error: { message: 'Invalid JSON.' } });
    }
    return;
  }

  json(response, 404, { error: { message: 'No test fixture for this endpoint.' } });
});

server.listen(3101, '127.0.0.1');
