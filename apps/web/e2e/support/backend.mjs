import { createServer } from 'node:http';

/** Browser-suite fixture for the web app's server-side API and CMS calls. */
const server = createServer(async (request, response) => {
  const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname;

  function json(status, body) {
    response.writeHead(status, { 'content-type': 'application/json' });
    response.end(JSON.stringify(body));
  }

  if (request.method === 'GET' && path === '/health') {
    json(200, { ok: true });
    return;
  }

  if (
    request.method === 'GET' &&
    /^\/api\/(posts|pages|policies|service-presentations)$/.test(path)
  ) {
    json(200, { docs: [] });
    return;
  }

  if (request.method === 'POST' && path === '/v1/enquiries') {
    let raw = '';
    for await (const chunk of request) raw += chunk;
    try {
      const body = JSON.parse(raw);
      if (!body.name || !body.email || !body.message || body.consent !== true) {
        json(400, { error: { message: 'Invalid enquiry.' } });
        return;
      }
      json(201, {
        reference: 'CERA-260928-TEST1',
        submittedAt: new Date().toISOString(),
        message: 'Submitted.',
      });
    } catch {
      json(400, { error: { message: 'Invalid JSON.' } });
    }
    return;
  }

  json(404, { error: { message: 'No test fixture for this endpoint.' } });
});

server.listen(3101, '127.0.0.1');
