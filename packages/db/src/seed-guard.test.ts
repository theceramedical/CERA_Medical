import { describe, expect, it } from 'vitest';

import { assertSeedAllowed, evaluateSeedGuard, SEED_OVERRIDE_VALUE } from './seed-guard.ts';

const LOCAL = 'postgres://cera_app:localdev_app@localhost:5432/cera_app';

describe('evaluateSeedGuard', () => {
  it('allows a local database', () => {
    expect(evaluateSeedGuard(LOCAL, {})).toEqual({ allowed: true, reason: 'local' });
  });

  it('refuses when NODE_ENV is production', () => {
    const result = evaluateSeedGuard(LOCAL, { nodeEnv: 'production' });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('node_env_production');
  });

  it('refuses a production-shaped NODE_ENV even with the override set', () => {
    // Checked before the override on purpose. The override is for a staging database
    // that happens to carry a production-shaped host name, not for production - and
    // an override that could reach production is not a guard.
    const result = evaluateSeedGuard(LOCAL, {
      nodeEnv: 'production',
      override: SEED_OVERRIDE_VALUE,
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('node_env_production');
  });

  it.each([
    'postgres://u:p@db.prod.internal:5432/cera_app',
    'postgres://u:p@live-db:5432/cera_app',
    'postgres://u:p@postgres.staging.example:5432/cera_app',
    'postgres://u:p@db.cera.example.com:5432/cera_app',
    'postgres://u:p@cera.abcdef.eu-west-2.rds.amazonaws.com:5432/cera_app',
    'postgres://u:p@ep-cool-name.eu-central-1.aws.neon.tech/cera_app',
    'postgres://u:p@db.abcdefgh.supabase.co:5432/postgres',
  ])('refuses a connection string that looks deployed: %s', (connectionString) => {
    // Deliberately broad matching: a false positive costs one environment variable,
    // a false negative costs a production database.
    const result = evaluateSeedGuard(connectionString, {});

    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('connection_looks_production');
  });

  it.each([
    'postgres://cera_app:pw@localhost:5432/cera_app',
    'postgres://cera_app:pw@127.0.0.1:5432/cera_app',
    'postgres://cera_app:pw@postgres:5432/cera_app',
    'postgres://cera_app:pw@host.docker.internal:5432/cera_app_test',
  ])('allows a local or in-cluster connection string: %s', (connectionString) => {
    expect(evaluateSeedGuard(connectionString, {}).allowed).toBe(true);
  });

  it('matches case-insensitively', () => {
    // A host name in a different case is the same host.
    expect(evaluateSeedGuard('postgres://u:p@DB.PROD.INTERNAL/cera', {}).allowed).toBe(false);
  });

  it('allows a deployed-looking target when the override is set exactly', () => {
    const result = evaluateSeedGuard('postgres://u:p@db.prod.internal/cera', {
      override: SEED_OVERRIDE_VALUE,
    });

    expect(result).toEqual({ allowed: true, reason: 'overridden' });
  });

  it.each(['true', '1', 'yes', SEED_OVERRIDE_VALUE.toUpperCase(), ` ${SEED_OVERRIDE_VALUE} `])(
    'ignores an override that is not the exact value: %s',
    (override) => {
      // An escape hatch that accepts `1` is one that gets set by a CI template
      // someone copied. It has to be typed out in full.
      expect(evaluateSeedGuard('postgres://u:p@db.prod.internal/cera', { override }).allowed).toBe(
        false,
      );
    },
  );

  it('names the override in the refusal, so the message is actionable', () => {
    const result = evaluateSeedGuard('postgres://u:p@db.prod.internal/cera', {});

    expect(result.allowed).toBe(false);
    expect(result.allowed === false && result.message).toContain(SEED_OVERRIDE_VALUE);
  });
});

describe('assertSeedAllowed', () => {
  it('returns quietly when seeding is permitted', () => {
    expect(() => {
      assertSeedAllowed(LOCAL, {});
    }).not.toThrow();
  });

  it('throws with the refusal message', () => {
    expect(() => {
      assertSeedAllowed(LOCAL, { nodeEnv: 'production' });
    }).toThrow('Refusing to seed: NODE_ENV is production.');
  });
});
