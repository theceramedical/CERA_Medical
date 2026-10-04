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

const E2E_ORIGIN = 'http://127.0.0.1:3100';
const VENDURE_COOKIE = 'cera_vendure_token';

const PHYSICAL_LINES = {
  'CR-CEL-8402': {
    title: 'CERA-GLIO-01: Authenticated Human Glioblastoma Multiforme Primary Cell Cohort',
    unitPriceMinor: 13_440_000,
  },
  'CR-MOL-1021': {
    title: 'CERA-QPCR-100: High-Fidelity SybrGreen qPCR Master Mix (2X)',
    unitPriceMinor: 420_000,
  },
};

/** @type {Map<string, { currencyCode: string, lines: object[] }>} */
const carts = new Map();

function cors(response) {
  response.setHeader('access-control-allow-origin', E2E_ORIGIN);
  response.setHeader('access-control-allow-credentials', 'true');
  response.setHeader('access-control-allow-headers', 'content-type');
  response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
}

function json(response, status, body, extraHeaders = {}) {
  cors(response);
  response.writeHead(status, { 'content-type': 'application/json', ...extraHeaders });
  response.end(JSON.stringify(body));
}

function readCookie(request, name) {
  const raw = request.headers.cookie ?? '';
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function emptyCart() {
  return { currencyCode: 'PKR', lines: [], subtotalMinor: 0, totalMinor: 0 };
}

function cartPayload(cart) {
  const subtotalMinor = cart.lines.reduce((sum, line) => sum + line.lineTotalMinor, 0);
  return {
    currencyCode: cart.currencyCode,
    lines: cart.lines,
    subtotalMinor,
    totalMinor: subtotalMinor,
  };
}

function ensureSession(token) {
  if (!carts.has(token)) {
    carts.set(token, { currencyCode: 'PKR', lines: [] });
  }
  return carts.get(token);
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

  if (request.method === 'OPTIONS') {
    cors(response);
    response.writeHead(204);
    response.end();
    return;
  }

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

  if (request.method === 'GET' && path === '/v1/cart') {
    const token = readCookie(request, VENDURE_COOKIE);
    if (token === null) {
      json(response, 200, emptyCart());
      return;
    }
    const cart = carts.get(token);
    json(response, 200, cart === undefined ? emptyCart() : cartPayload(cart));
    return;
  }

  if (request.method === 'POST' && path === '/v1/cart/lines') {
    let raw = '';
    for await (const chunk of request) raw += chunk;
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      json(response, 400, {
        error: { code: 'validation_failed', message: 'Invalid JSON.', retryable: false },
        requestId: 'e2e',
      });
      return;
    }
    const sku = body.slug;
    const quantity = typeof body.quantity === 'number' ? body.quantity : 1;
    const catalog = PHYSICAL_LINES[sku];
    if (catalog === undefined) {
      json(response, 404, {
        error: { code: 'not_found', message: 'Not found.', retryable: false },
        requestId: 'e2e',
      });
      return;
    }
    let token = readCookie(request, VENDURE_COOKIE);
    if (token === null || token.length === 0) {
      token = `e2e-${String(Date.now())}`;
    }
    const cart = ensureSession(token);
    const lineTotalMinor = catalog.unitPriceMinor * quantity;
    cart.lines = [
      {
        id: 'e2e-line-1',
        slug: sku,
        title: catalog.title,
        quantity,
        unitPriceMinor: catalog.unitPriceMinor,
        lineTotalMinor,
      },
    ];
    const payload = cartPayload(cart);
    json(response, 200, payload, {
      'set-cookie': `${VENDURE_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax`,
    });
    return;
  }

  if (request.method === 'POST' && path === '/v1/checkout/complete') {
    let raw = '';
    for await (const chunk of request) raw += chunk;
    try {
      const body = JSON.parse(raw);
      const token = readCookie(request, VENDURE_COOKIE);
      const cart = token === null ? undefined : carts.get(token);
      if (
        cart === undefined ||
        cart.lines.length === 0 ||
        typeof body.email !== 'string' ||
        typeof body.fullName !== 'string'
      ) {
        json(response, 400, {
          error: { code: 'validation_failed', message: 'Invalid checkout.', retryable: false },
          requestId: 'e2e',
        });
        return;
      }
      json(response, 200, { orderCode: 'E2E-CHECKOUT-0001' });
    } catch {
      json(response, 400, {
        error: { code: 'validation_failed', message: 'Invalid JSON.', retryable: false },
        requestId: 'e2e',
      });
    }
    return;
  }

  json(response, 404, { error: { message: 'No test fixture for this endpoint.' } });
});

server.listen(3101, '127.0.0.1');
