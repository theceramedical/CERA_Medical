import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { deliverCloudflareIntegration, handleCloudflareEnquiry } from './enquiries.ts';

import type { D1Database } from './runtime.ts';

const { getCloudflareDatabase } = vi.hoisted(() => ({ getCloudflareDatabase: vi.fn() }));

vi.mock('./runtime.ts', () => ({ getCloudflareDatabase }));

interface MockStatement {
  readonly query: string;
  readonly bindings: unknown[];
  bind(...values: unknown[]): MockStatement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
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
        all<T>() {
          return Promise.resolve({ results: [] as T[] });
        },
        run() {
          return Promise.resolve({ meta: { changes: 1 } });
        },
      };
      prepared.push(statement);
      return statement;
    },
    batch<T extends MockStatement[]>(statements: T) {
      const results = statements.map(() => ({ meta: { changes: 1 } }));
      return Promise.resolve(results as { [K in keyof T]: { meta: { changes: number } } });
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
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

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
    const { database } = createDatabase();
    const batch = vi.spyOn(database, 'batch');
    getCloudflareDatabase.mockResolvedValue(database);

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

  it('records successful Resend delivery only after the provider accepts the message', async () => {
    const { database, prepared } = createDatabase();
    vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
    vi.stubEnv('RESEND_FROM_EMAIL', 'CERA <mail@example.test>');
    vi.stubEnv('EMAIL_STAFF_ALERT_TO', 'staff@example.test');
    const send = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', send);
    const payload = JSON.stringify({
      reference: 'CERA-261101-ABCDE',
      name: 'Alex Example',
      email: 'alex@example.test',
      phone: null,
      institution: null,
      country: null,
      serviceId: 'research-collaboration',
      message: 'Please tell me about a research project.',
    });

    const results = await Promise.all([
      deliverCloudflareIntegration(
        database as unknown as D1Database,
        'enquiry-1',
        'resend.enquiry_ack',
        payload,
      ),
      deliverCloudflareIntegration(
        database as unknown as D1Database,
        'enquiry-1',
        'resend.enquiry_staff',
        payload,
      ),
    ]);

    expect(results).toEqual([
      { attempted: true, outcome: 'succeeded', deliveryStatus: 'succeeded' },
      { attempted: true, outcome: 'succeeded', deliveryStatus: 'succeeded' },
    ]);
    expect(send).toHaveBeenCalledTimes(2);
    const sentPayloads = send.mock.calls.map(
      ([, init]) =>
        JSON.parse(String(init?.body)) as {
          to: string[];
        },
    );
    expect(sentPayloads.map((email) => email.to[0])).toEqual([
      'alex@example.test',
      'staff@example.test',
    ]);
    expect(
      prepared.filter((statement) => statement.query.includes("SET status = 'succeeded'")),
    ).toHaveLength(2);
  });

  it('records a provider failure and leaves the delivery retryable', async () => {
    const { database, prepared } = createDatabase();
    vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
    vi.stubEnv('RESEND_FROM_EMAIL', 'CERA <mail@example.test>');
    vi.stubEnv('EMAIL_STAFF_ALERT_TO', 'staff@example.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));

    const result = await deliverCloudflareIntegration(
      database as unknown as D1Database,
      'enquiry-2',
      'resend.enquiry_staff',
      JSON.stringify({
        reference: 'CERA-261101-ABCDE',
        name: 'Alex Example',
        email: 'alex@example.test',
        phone: null,
        institution: null,
        country: null,
        serviceId: 'research-collaboration',
        message: 'Please tell me about a research project.',
      }),
    );

    expect(result).toEqual({ attempted: true, outcome: 'failed', deliveryStatus: 'failed' });
    expect(
      prepared.find((statement) => statement.query.includes("SET status = 'failed'"))?.bindings,
    ).toContain('resend_http_503');
    expect(
      prepared.find((statement) => statement.query.includes("SET status = 'failed'"))?.query,
    ).toContain("status = 'failed'");
  });

  it.each(['processing', 'succeeded'] as const)(
    'returns persisted %s status separately when another attempt owns the delivery claim',
    async (deliveryStatus) => {
      const statement = {
        bind: vi.fn(() => statement),
        first: vi.fn().mockResolvedValue({ status: deliveryStatus }),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ meta: { changes: 0 } }),
      };
      const database = {
        prepare: vi.fn(() => statement),
        batch: vi.fn().mockResolvedValue([]),
      };
      const send = vi.fn();
      vi.stubGlobal('fetch', send);

      const result = await deliverCloudflareIntegration(
        database,
        'enquiry-3',
        'resend.enquiry_staff',
        '{}',
      );

      expect(result).toEqual({ attempted: false, outcome: 'not_claimed', deliveryStatus });
      expect(send).not.toHaveBeenCalled();
      expect(statement.run).toHaveBeenCalledOnce();
      vi.unstubAllGlobals();
    },
  );

  it('returns an explicit not-found outcome when no D1 delivery row remains after claim failure', async () => {
    const statement = {
      bind: vi.fn(() => statement),
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ meta: { changes: 0 } }),
    };
    const database = {
      prepare: vi.fn(() => statement),
      batch: vi.fn().mockResolvedValue([]),
    };

    await expect(
      deliverCloudflareIntegration(database, 'enquiry-3', 'resend.enquiry_staff', '{}'),
    ).resolves.toEqual({ attempted: false, outcome: 'not_found', deliveryStatus: null });
  });
});
