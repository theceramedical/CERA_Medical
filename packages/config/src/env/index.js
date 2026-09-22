import { z } from 'zod';

/**
 * Environment contract - FND-005.
 *
 * Two properties matter here:
 *
 *  1. It fails fast, and it reports EVERY missing variable at once. Validating
 *     one variable per restart turns a five-minute setup into an hour.
 *  2. It is the counterpart of .env.example. A test asserts the two describe the
 *     same variable set, so documentation cannot silently drift from code.
 *
 * No default is ever supplied for a secret. A defaulted secret is how a
 * development key reaches production (PRD 15).
 */

const nonEmpty = z.string().min(1);
const url = z.string().url();
const port = z.coerce.number().int().min(1).max(65_535);

/** Variables every service needs. */
export const commonEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CERA_ENV: z.enum(['local', 'staging', 'production']).default('local'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  RELEASE: z.string().default('dev'),
});

export const databaseEnvSchema = z.object({
  DATABASE_URL: nonEmpty.describe('postgres://user:pass@host:5432/db'),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
});

export const valkeyEnvSchema = z.object({
  VALKEY_URL: nonEmpty.describe('redis://host:6379/0'),
});

export const webEnvSchema = commonEnvSchema.extend({
  PORT: port.default(3000),
  NEXT_PUBLIC_SITE_URL: url,
  NEXT_PUBLIC_API_URL: url,
  CMS_URL: url,
  PAYLOAD_PREVIEW_SECRET: nonEmpty,
  SESSION_SECRET: nonEmpty.describe('32+ byte base64 key for JWE session sealing'),
  OIDC_ISSUER: url,
  OIDC_CLIENT_ID: nonEmpty,
  OIDC_CLIENT_SECRET: nonEmpty,
  OIDC_REDIRECT_URI: url,
  GLITCHTIP_DSN: z.string().optional(),
});

export const apiEnvSchema = commonEnvSchema
  .merge(databaseEnvSchema)
  .merge(valkeyEnvSchema)
  .extend({
    PORT: port.default(3003),
    CORS_ALLOWED_ORIGINS: nonEmpty.describe('comma-separated absolute origins'),
    SESSION_SECRET: nonEmpty,
    OIDC_ISSUER: url,
    OIDC_JWKS_URI: url,
    VENDURE_SHOP_API_URL: url,
    CMS_API_URL: url,
    RESEND_WEBHOOK_SECRET: nonEmpty.describe('Svix whsec_... signing secret'),
    RATE_LIMIT_ENQUIRY_PER_IP_HOUR: z.coerce.number().int().min(1).default(10),
    RATE_LIMIT_ENQUIRY_PER_EMAIL_HOUR: z.coerce.number().int().min(1).default(5),
    IP_HASH_SALT: nonEmpty.describe('salt for rate-limit IP hashing; never store raw IPs'),
    GLITCHTIP_DSN: z.string().optional(),
  });

export const workerEnvSchema = commonEnvSchema
  .merge(databaseEnvSchema)
  .merge(valkeyEnvSchema)
  .extend({
    PORT: port.default(3004),
    OUTBOX_BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(25),
    OUTBOX_SWEEP_INTERVAL_MS: z.coerce.number().int().min(1000).default(15_000),
    OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(20).default(8),

    // Driver selection is the whole sandbox-first strategy: real credentials
    // arrive as an env change, never a code change.
    EMAIL_DRIVER: z.enum(['fake', 'smtp', 'resend']).default('fake'),
    CRM_DRIVER: z.enum(['fake', 'zoho']).default('fake'),
    STORAGE_DRIVER: z.enum(['fake', 's3']).default('fake'),

    SMTP_URL: z.string().optional().describe('required when EMAIL_DRIVER=smtp'),
    RESEND_API_KEY: z.string().optional().describe('required when EMAIL_DRIVER=resend'),
    EMAIL_FROM: nonEmpty.default('CERA Medical <noreply@cera.localhost>'),
    EMAIL_STAFF_ALERT_TO: nonEmpty.default('operations@cera.localhost'),

    ZOHO_ACCOUNTS_URL: z.string().optional(),
    ZOHO_CLIENT_ID: z.string().optional(),
    ZOHO_CLIENT_SECRET: z.string().optional(),
    ZOHO_REFRESH_TOKEN: z.string().optional(),
    ZOHO_EXTERNAL_FIELD: z
      .string()
      .optional()
      .describe('unset falls back to Email deduplication; see ADR-006'),

    S3_ENDPOINT: z.string().optional(),
    S3_REGION: z.string().default('auto'),
    S3_BUCKET: z.string().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_PUBLIC_URL: z.string().optional(),
    GLITCHTIP_DSN: z.string().optional(),
  })
  // A driver that is selected but unconfigured must fail at boot, not on the
  // first job. This is the difference between a startup error and a silently
  // dead-lettered enquiry.
  .superRefine((env, ctx) => {
    const requireWhen = (condition, keys, driver) => {
      if (!condition) return;
      for (const key of keys) {
        if (env[key] === undefined || env[key] === '') {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when the driver is "${driver}".`,
          });
        }
      }
    };

    requireWhen(env.EMAIL_DRIVER === 'smtp', ['SMTP_URL'], 'smtp');
    requireWhen(env.EMAIL_DRIVER === 'resend', ['RESEND_API_KEY'], 'resend');
    requireWhen(
      env.CRM_DRIVER === 'zoho',
      ['ZOHO_ACCOUNTS_URL', 'ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_REFRESH_TOKEN'],
      'zoho',
    );
    requireWhen(
      env.STORAGE_DRIVER === 's3',
      ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'],
      's3',
    );
  });

export const cmsEnvSchema = commonEnvSchema.merge(databaseEnvSchema).extend({
  PORT: port.default(3001),
  PAYLOAD_SECRET: nonEmpty,
  PAYLOAD_PUBLIC_SERVER_URL: url,
  PAYLOAD_PREVIEW_SECRET: nonEmpty,
  WEB_URL: url,
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('auto'),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(),
  GLITCHTIP_DSN: z.string().optional(),
});

export const commerceEnvSchema = commonEnvSchema.extend({
  PORT: port.default(3002),
  DB_HOST: nonEmpty,
  DB_PORT: port.default(5432),
  DB_NAME: nonEmpty,
  DB_USERNAME: nonEmpty,
  DB_PASSWORD: nonEmpty,
  VALKEY_HOST: nonEmpty,
  VALKEY_PORT: port.default(6379),
  SUPERADMIN_USERNAME: nonEmpty,
  SUPERADMIN_PASSWORD: nonEmpty,
  COOKIE_SECRET: nonEmpty,
  CORS_ALLOWED_ORIGINS: z.string().default(''),
  ASSET_URL_PREFIX: z.string().optional(),
  GLITCHTIP_DSN: z.string().optional(),
});

/**
 * Parse and validate, reporting every problem at once.
 *
 * @template T
 * @param {import('zod').ZodType<T>} schema
 * @param {NodeJS.ProcessEnv} source
 * @param {string} serviceName
 * @returns {T}
 */
export function loadEnv(schema, source = process.env, serviceName = 'service') {
  const result = schema.safeParse(source);
  if (result.success) return result.data;

  const problems = result.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');

  throw new Error(
    `Invalid environment for ${serviceName}. Fix all of the following, then restart:\n${problems}\n\n` +
      `See .env.example for the full contract. Never copy a real secret into the repository.`,
  );
}

/** Every schema, keyed by service. Used by the drift test against .env.example. */
export const envSchemas = {
  web: webEnvSchema,
  api: apiEnvSchema,
  worker: workerEnvSchema,
  cms: cmsEnvSchema,
  commerce: commerceEnvSchema,
};
