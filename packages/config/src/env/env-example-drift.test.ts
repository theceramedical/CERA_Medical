import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { envSchemas } from './index.js';

/**
 * FND-005: `.env.example` and the Zod schemas must describe the same variables.
 *
 * Documentation that drifts from code is worse than no documentation, because it
 * is trusted. The usual failure is undramatic: someone adds a variable to a
 * schema, the service works on their machine because their `.env` already has
 * it, and the next person's checkout fails at boot with no hint of what to add.
 *
 * This test makes that specific mistake impossible to merge.
 */

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const envExamplePath = resolve(repoRoot, '.env.example');

/** Variable names declared in `.env.example`, ignoring comments and blanks. */
function readExampleKeys(): Set<string> {
  const contents = readFileSync(envExamplePath, 'utf8');
  const keys = new Set<string>();

  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const match = /^([A-Z][A-Z0-9_]*)=/.exec(trimmed);
    if (match?.[1] !== undefined) keys.add(match[1]);
  }

  return keys;
}

/** Variable names a schema expects. */
function schemaKeys(schema: unknown): string[] {
  // Unwrap the effects wrapper that `superRefine` adds, so refined schemas are
  // introspectable too.
  let current = schema as { _def?: { schema?: unknown; shape?: unknown }; shape?: unknown };
  while (current?._def?.schema !== undefined) {
    current = current._def.schema as typeof current;
  }

  const shape = (current as { shape?: Record<string, unknown> }).shape;
  return shape === undefined ? [] : Object.keys(shape);
}

/**
 * Variables that legitimately exist in only one place.
 *
 * Kept short and individually justified. A growing allow-list means the test is
 * being worked around rather than satisfied.
 */
const EXAMPLE_ONLY = new Set([
  // Consumed by Docker Compose and the Postgres init script, never by app code.
  // Used by the production Caddy edge and deployment health checks, not app code.
  'CADDY_ACME_EMAIL',
  'CERA_DOMAIN',
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_SUPERUSER',
  'POSTGRES_SUPERUSER_PASSWORD',
  'CERA_APP_DB',
  'CERA_APP_DB_USER',
  'CERA_APP_DB_PASSWORD',
  'CERA_CMS_DB',
  'CERA_CMS_DB_USER',
  'CERA_CMS_DB_PASSWORD',
  'CERA_COMMERCE_DB',
  'CERA_COMMERCE_DB_USER',
  'CERA_COMMERCE_DB_PASSWORD',
  'AUTHENTIK_DB',
  'AUTHENTIK_DB_USER',
  'AUTHENTIK_DB_PASSWORD',
  'GLITCHTIP_DB',
  'GLITCHTIP_DB_USER',
  'GLITCHTIP_DB_PASSWORD',
  // Container configuration for services that are not CERA applications.
  'AUTHENTIK_SECRET_KEY',
  'AUTHENTIK_BOOTSTRAP_PASSWORD',
  'AUTHENTIK_BOOTSTRAP_EMAIL',
  'GLITCHTIP_DOMAIN',
  'GLITCHTIP_SECRET_KEY',
  'GLITCHTIP_MAX_EVENT_LIFE_DAYS',
  'MINIO_ROOT_USER',
  'MINIO_ROOT_PASSWORD',
  // Read by infra/scripts/backup.sh, not by any service.
  'BACKUP_AGE_PUBLIC_KEY',
  'BACKUP_RETENTION_DAYS',
  'BACKUP_TARGET_DIR',
  // Per-service port aliases. Each schema reads PORT; Compose maps these to it.
  'API_PORT',
  'CMS_PORT',
  'COMMERCE_PORT',
  'WORKER_PORT',
]);

const SCHEMA_ONLY = new Set([
  // Supplied by the runtime or the container, not by a developer's .env.
  'PORT',
  'NODE_ENV',
  // Vendure reads discrete DB_* variables; .env.example documents the composed
  // DATABASE_URL plus the POSTGRES_* parts the init script needs.
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USERNAME',
  'DB_PASSWORD',
]);

describe('.env.example matches the environment schemas', () => {
  const exampleKeys = readExampleKeys();

  it('parses at least one variable, so a silent read failure cannot pass', () => {
    // Without this, a bad path would make every comparison below trivially true.
    expect(exampleKeys.size).toBeGreaterThan(30);
  });

  it('can introspect every schema, so the comparisons are not vacuous', () => {
    // This is the guard that matters most in this file. If `schemaKeys` ever
    // returns nothing - because a Zod version changes how a refined schema is
    // shaped, for instance - every "documents every variable" assertion below
    // passes against an empty list and the whole suite becomes decorative.
    for (const [serviceName, schema] of Object.entries(envSchemas)) {
      const keys = schemaKeys(schema);
      expect(
        keys.length,
        `Could not read any keys from the ${serviceName} schema. schemaKeys() needs updating for the ` +
          `current Zod version; until it is fixed, the drift checks in this file prove nothing.`,
      ).toBeGreaterThan(0);
    }
  });

  it('detects a variable that is missing from .env.example', () => {
    // Proves the mechanism works, rather than trusting that it does.
    const undocumented = ['DEFINITELY_NOT_IN_ENV_EXAMPLE'].filter((key) => !exampleKeys.has(key));

    expect(undocumented).toEqual(['DEFINITELY_NOT_IN_ENV_EXAMPLE']);
  });

  for (const [serviceName, schema] of Object.entries(envSchemas)) {
    it(`documents every variable the ${serviceName} schema requires`, () => {
      const undocumented = schemaKeys(schema)
        .filter((key) => !exampleKeys.has(key))
        .filter((key) => !SCHEMA_ONLY.has(key));

      expect(
        undocumented,
        `The ${serviceName} schema expects these variables, but .env.example does not document them. ` +
          `Add each one with a placeholder value and a comment explaining its purpose, or add it to ` +
          `SCHEMA_ONLY with a reason if it is genuinely supplied by the runtime.`,
      ).toEqual([]);
    });
  }

  it('does not document variables no schema reads', () => {
    const allSchemaKeys = new Set(
      Object.values(envSchemas).flatMap((schema) => schemaKeys(schema)),
    );

    const unused = [...exampleKeys]
      .filter((key) => !allSchemaKeys.has(key))
      .filter((key) => !EXAMPLE_ONLY.has(key));

    expect(
      unused,
      `.env.example documents these variables, but no schema reads them. They are probably left over ` +
        `from a removed feature. Delete them, or add to EXAMPLE_ONLY with a reason if they are consumed ` +
        `by Compose or a shell script rather than by application code.`,
    ).toEqual([]);
  });

  it('contains no value that looks like a real secret', () => {
    const contents = readFileSync(envExamplePath, 'utf8');

    // PRD 15 prohibits credentials in the repository. These patterns match the
    // live key formats of the providers this platform uses.
    const secretPatterns: { name: string; pattern: RegExp }[] = [
      { name: 'Resend API key', pattern: /\bre_[A-Za-z0-9]{16,}/ },
      { name: 'Svix signing secret', pattern: /\bwhsec_[A-Za-z0-9+/=]{20,}/ },
      { name: 'erpnext OAuth token', pattern: /\b1000\.[A-Fa-f0-9]{32,}/ },
      { name: 'AWS access key id', pattern: /\bAKIA[0-9A-Z]{16}\b/ },
      { name: 'private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
      { name: 'GitHub token', pattern: /\bgh[pousr]_[A-Za-z0-9]{36,}/ },
    ];

    const found = secretPatterns
      .filter(({ pattern }) => pattern.test(contents))
      .map(({ name }) => name);

    expect(
      found,
      `.env.example appears to contain a real credential (${found.join(', ')}).`,
    ).toEqual([]);
  });
});
