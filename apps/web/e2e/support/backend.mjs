import { createServer } from 'node:http';

/** Browser-suite fixture for the web app's server-side API and CMS calls. */

const ISO = '2026-01-01T00:00:00.000Z';

const ENQUIRY_PAGE = {
  id: 'e2e-enquiry-page',
  slug: 'enquiry',
  title: 'Make an Enquiry',
  excerpt: 'Tell us which service you are interested in and how to reach you.',
  body: null,
  layout: [
    {
      blockType: 'sectionHeading',
      eyebrow: 'Project enquiry',
      heading: 'Make an Enquiry',
      body: 'Tell us which service you are interested in and how to reach you.',
    },
  ],
  seo: {
    title: 'Make an Enquiry | CERA Medical',
    description: 'Submit an enquiry about a CERA Medical service and track it in your account.',
    noIndex: false,
  },
  _status: 'published',
  publishedAt: ISO,
  createdAt: ISO,
  updatedAt: ISO,
};

const SITE_SETTINGS = {
  enquiryForm: {
    consentVersion: 'cera-brief-2026-10-03-v1',
    extraServices: [
      { slug: 'research-collaboration', title: 'Research collaboration' },
      { slug: 'other-enquiry', title: 'Other enquiry' },
    ],
  },
};

function json(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

function cmsPages(url) {
  const slug = url.searchParams.get('where[slug][equals]');
  if (slug === 'enquiry') {
    return { docs: [ENQUIRY_PAGE] };
  }
  return { docs: [] };
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
