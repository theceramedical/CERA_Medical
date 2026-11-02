import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getCloudflareDatabase } = vi.hoisted(() => ({ getCloudflareDatabase: vi.fn() }));

vi.mock('./runtime.ts', () => ({ getCloudflareDatabase }));

import { CloudflareApiError } from './api-error.ts';
import { handleCloudflareOpsApi } from './ops-api.ts';

interface Statement {
  readonly query: string;
  readonly bindings: unknown[];
  bind(...values: unknown[]): Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}

const staff = {
  sub: 'staff-1',
  email: 'staff@example.test',
  emailVerified: true,
  roles: ['enquiry_handler'],
} as const;
const administrator = { ...staff, roles: ['administrator'] } as const;
const auditor = { ...staff, roles: ['auditor'] } as const;

function createDatabase(claimChanges = 1, existingStatus: string | null = null) {
  const statements: Statement[] = [];
  const database = {
    prepare(query: string): Statement {
      const statement: Statement = {
        query,
        bindings: [],
        bind(...values) {
          statement.bindings.push(...values);
          return statement;
        },
        first<T>() {
          if (query.includes('SELECT COUNT(*) AS count FROM internal_notes'))
            return Promise.resolve({ count: 0 } as T);
          if (query.includes('SELECT status FROM integration_deliveries'))
            return Promise.resolve(existingStatus ? ({ status: existingStatus } as T) : null);
          if (query.includes('FROM integration_deliveries WHERE id = ?'))
            return Promise.resolve({
              aggregateId: 'enquiry-1',
              channel: 'resend.enquiry_staff',
              payload: JSON.stringify({
                reference: 'CERA-261101-ABCDE',
                name: 'Alex Example',
                email: 'alex@example.test',
                phone: null,
                institution: null,
                country: null,
                serviceId: 'research-collaboration',
                message: 'Please tell me about a research project.',
              }),
            } as T);
          return Promise.resolve(null);
        },
        all<T>() {
          if (query.includes('SELECT * FROM enquiries'))
            return Promise.resolve({
              results: [
                {
                  id: 'enquiry-1',
                  reference: 'CERA-261101-ABCDE',
                  customer_user_id: null,
                  name: 'Alex Example',
                  email: 'alex@example.test',
                  phone: null,
                  organisation: null,
                  country: null,
                  service_slug: 'research-collaboration',
                  summary: 'Please tell me about a research project.',
                  consent_version: 'consent-test-v1',
                  sequencing_data_consent: 0,
                  samples_compounds_consent: 0,
                  health_data_consent: 0,
                  updates_opt_in: 0,
                  source: 'web_general',
                  internal_status: 'received',
                  assigned_staff_id: null,
                  version: 1,
                  created_at: 100,
                  updated_at: 100,
                },
              ] as T[],
            });
          return Promise.resolve({
            results: [
              {
                id: 'delivery-1',
                aggregateType: 'enquiry',
                aggregateId: 'enquiry-1',
                channel: 'resend.enquiry_staff',
                status: 'failed',
                attempts: 1,
                lastError: 'configuration_missing',
                createdAt: 100,
                updatedAt: 101,
              },
            ] as T[],
          });
        },
        run() {
          return Promise.resolve({
            meta: { changes: query.includes("SET status = 'processing'") ? claimChanges : 1 },
          });
        },
      };
      statements.push(statement);
      return statement;
    },
    batch() {
      return Promise.resolve([]);
    },
  };
  return { database, statements };
}

describe('Cloudflare staff queue and delivery operations', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    getCloudflareDatabase.mockResolvedValue(createDatabase().database);
    vi.stubEnv('RESEND_API_KEY', '');
    vi.stubEnv('RESEND_FROM_EMAIL', '');
    vi.stubEnv('EMAIL_STAFF_ALERT_TO', '');
  });

  it('lets staff retrieve recorded delivery status and exposes failed work as retryable', async () => {
    const { database, statements } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);

    const result = await handleCloudflareOpsApi('/v1/ops/deliveries', 'GET', undefined, auditor);

    expect(result?.items).toEqual([
      expect.objectContaining({
        id: 'delivery-1',
        status: 'dead_letter',
        attempt: 1,
        lastError: 'configuration_missing',
      }),
    ]);
    expect(
      statements.some((statement) => statement.query.includes('FROM integration_deliveries')),
    ).toBe(true);
  });

  it('lets staff retrieve an enquiry that is persisted in D1', async () => {
    const { database, statements } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);

    const result = await handleCloudflareOpsApi('/v1/ops/enquiries', 'GET', undefined, auditor);

    expect(result?.items).toEqual([
      expect.objectContaining({
        id: 'enquiry-1',
        reference: 'CERA-261101-ABCDE',
        serviceId: 'research-collaboration',
        consentVersion: 'consent-test-v1',
      }),
    ]);
    expect(
      statements.some(
        (statement) =>
          statement.query === 'SELECT * FROM enquiries ORDER BY created_at DESC LIMIT 250',
      ),
    ).toBe(true);
  });

  it('denies a delivery retry to a staff member without the administrator role', async () => {
    const { database, statements } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);

    await expect(
      handleCloudflareOpsApi('/v1/ops/deliveries/delivery-1/retry', 'POST', undefined, staff),
    ).rejects.toMatchObject({ name: 'CloudflareApiError', status: 403 });
    expect(statements).toHaveLength(0);
  });

  it('allows an administrator to retry and records the new failed attempt when Resend is unconfigured', async () => {
    const { database, statements } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);

    const result = await handleCloudflareOpsApi(
      '/v1/ops/deliveries/delivery-1/retry',
      'POST',
      undefined,
      administrator,
    );

    expect(result).toEqual({
      attempted: true,
      retryOutcome: 'failed',
      deliveryStatus: 'failed',
    });
    expect(
      statements.some(
        (statement) =>
          statement.query.includes("SET status = 'failed'") &&
          statement.bindings.includes('configuration_missing'),
      ),
    ).toBe(true);
  });

  it('reports successful delivery only after Resend accepts an administrator retry', async () => {
    const { database, statements } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);
    vi.stubEnv('RESEND_API_KEY', 'test-resend-key');
    vi.stubEnv('RESEND_FROM_EMAIL', 'CERA <mail@example.test>');
    vi.stubEnv('EMAIL_STAFF_ALERT_TO', 'staff@example.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 202 })));

    const result = await handleCloudflareOpsApi(
      '/v1/ops/deliveries/delivery-1/retry',
      'POST',
      undefined,
      administrator,
    );

    expect(result).toEqual({
      attempted: true,
      retryOutcome: 'succeeded',
      deliveryStatus: 'succeeded',
    });
    expect(
      statements.some((statement) => statement.query.includes("SET status = 'succeeded'")),
    ).toBe(true);
  });

  it.each(['processing', 'succeeded'] as const)(
    'reports the persisted %s state when another worker already owns the retry',
    async (existingStatus) => {
      const { database } = createDatabase(0, existingStatus);
      getCloudflareDatabase.mockResolvedValue(database);

      const result = await handleCloudflareOpsApi(
        '/v1/ops/deliveries/delivery-1/retry',
        'POST',
        undefined,
        administrator,
      );

      expect(result).toEqual({
        attempted: false,
        retryOutcome: 'not_claimed',
        deliveryStatus: existingStatus,
      });
    },
  );

  it('returns not found when a retry claim misses and the D1 delivery row has been removed', async () => {
    const { database } = createDatabase(0, null);
    getCloudflareDatabase.mockResolvedValue(database);

    await expect(
      handleCloudflareOpsApi(
        '/v1/ops/deliveries/delivery-1/retry',
        'POST',
        undefined,
        administrator,
      ),
    ).rejects.toMatchObject({ name: 'CloudflareApiError', status: 404 });
  });

  it('denies non-staff queue reads', async () => {
    const { database, statements } = createDatabase();
    getCloudflareDatabase.mockResolvedValue(database);
    const customer = { ...staff, roles: ['customer'] } as const;

    await expect(
      handleCloudflareOpsApi('/v1/ops/deliveries', 'GET', undefined, customer),
    ).rejects.toBeInstanceOf(CloudflareApiError);
    expect(statements).toHaveLength(0);
  });
});
