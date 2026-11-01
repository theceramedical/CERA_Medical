import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getCloudflareDatabase } = vi.hoisted(() => ({ getCloudflareDatabase: vi.fn() }));

vi.mock('./runtime.ts', () => ({ getCloudflareDatabase }));

import { handleCloudflareEnquiry } from './enquiries.ts';

interface MockStatement {
  readonly query: string;
  readonly bindings: unknown[];
  bind(...values: unknown[]): MockStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
}

function createDatabase() {
  const prepared: MockStatement[] = [];
  const database = {
    prepare(query: string): MockStatement {
      const statement: MockStatement = {
        query,
        bindings: [],
        bind(...values) {
          statement.bindings.push(...values);
          return statement;
        },
        first<T>() {
          return Promise.resolve(
            (query.includes('AS email_count') ? { email_count: 1, ip_count: 1 } : null) as T | null,
          );
        },
        run() {
          return Promise.resolve({ meta: { changes: 1 } });
        },
      };
      prepared.push(statement);
      return statement;
    },
    batch(statements: MockStatement[]) {
      return Promise.resolve(statements.map(() => ({ meta: { changes: 1 } })));
    },
  };
  return { database, prepared };
}

function enquiryRequest(serviceId: string, idempotencyKey: string): Request {
  return new Request('https://www.ceramedical.org/v1/enquiries', {
    method: 'POST',
    headers: {
      origin: 'https://www.ceramedical.org',
      'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify({
      name: 'Alex Example',
      email: 'alex@example.com',
      serviceId,
      message: 'Please tell me about a research project.',
      consent: true,
      consentVersion: 'consent-test-v1',
      samplesCompoundsConsent: serviceId === 'preclinical-studies',
      source: 'web_general',
    }),
  });
}

describe('Cloudflare enquiry intake', () => {
  afterEach(() => vi.unstubAllEnvs());

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('ENQUIRY_RATE_LIMIT_SALT', 'test-only-rate-limit-salt');
    vi.stubEnv('ENQUIRY_CONSENT_VERSION', 'consent-test-v1');
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('RESEND_FROM_EMAIL', '');
    vi.stubEnv('EMAIL_STAFF_ALERT_TO', '');
  });

  it('stores consent, the queue record, and both email outbox entries before accepting', async () => {
    const { database, prepared } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);

    const response = await handleCloudflareEnquiry(
      enquiryRequest('research-collaboration', 'enquiry-request-1234'),
    );
    const payload = (await response?.json()) as { reference: string };

    expect(response?.status).toBe(201);
    expect(payload.reference).toMatch(/^CERA-\d{6}-[0-9A-Z]+$/);
    expect(prepared.some((statement) => statement.query.includes('INSERT INTO enquiries'))).toBe(
      true,
    );
    const enquiryInsert = prepared.find((statement) =>
      statement.query.includes('INSERT INTO enquiries'),
    );
    expect(enquiryInsert?.query).toContain('consent_version');
    expect(enquiryInsert?.query).toContain('updates_opt_in');
    expect(
      prepared.some((statement) => statement.query.includes('INSERT INTO integration_deliveries')),
    ).toBe(true);
    expect(
      prepared.filter(
        (statement) =>
          statement.query.includes("SET status = 'failed'") &&
          statement.bindings.includes('configuration_missing'),
      ),
    ).toHaveLength(2);
  });

  it('keeps identical customer text for different services as distinct enquiries', async () => {
    const { database, prepared } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);

    const first = await handleCloudflareEnquiry(
      enquiryRequest('research-collaboration', 'enquiry-request-1234'),
    );
    const second = await handleCloudflareEnquiry(
      enquiryRequest('preclinical-studies', 'enquiry-request-5678'),
    );

    expect(first?.status).toBe(201);
    expect(second?.status).toBe(201);
    const fingerprints = prepared
      .filter((statement) =>
        statement.query.includes('SELECT reference FROM enquiries WHERE fingerprint'),
      )
      .map((statement) => statement.bindings[0]);
    expect(fingerprints).toHaveLength(2);
    expect(fingerprints[0]).not.toBe(fingerprints[1]);
  });

  it('rejects missing request consent before writing to D1', async () => {
    const batch = vi.fn();
    getCloudflareDatabase.mockResolvedValue({ prepare: vi.fn(), batch });

    const response = await handleCloudflareEnquiry(
      new Request('https://www.ceramedical.org/v1/enquiries', {
        method: 'POST',
        headers: {
          origin: 'https://www.ceramedical.org',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Alex Example',
          email: 'alex@example.com',
          serviceId: 'research-collaboration',
          message: 'Please tell me about a research collaboration.',
          consent: false,
          consentVersion: 'consent-test-v1',
          source: 'web_general',
        }),
      }),
    );

    expect(response?.status).toBe(422);
    expect(batch).not.toHaveBeenCalled();
  });
});
