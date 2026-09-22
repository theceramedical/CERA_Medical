/**
 * The guard that decides whether seeding is allowed to proceed.
 *
 * In its own module, and tested, because it is the only thing standing between
 * `pnpm seed` and inserting fourteen synthetic enquiries into a live database -
 * complete with claim tokens, which would attach real customers' records to a
 * fixture account. Every other part of the seeder can be verified by running it;
 * this part can only be verified by *not* running it, which is exactly the kind of
 * behaviour that stays unverified when it lives inside a CLI.
 */

/** The override, spelled out in full so nobody sets it by accident. */
export const SEED_OVERRIDE_VALUE = 'i-understand-this-inserts-fixture-data';

/**
 * Host and database names that indicate a real deployment.
 *
 * Matched case-insensitively against the whole connection string. Deliberately
 * broad: a false positive costs one environment variable, and a false negative
 * costs a production database.
 */
const PRODUCTION_HINTS = /prod|live|staging|\.cera\.|amazonaws|neon\.tech|supabase\.co/i;

export interface SeedGuardEnvironment {
  nodeEnv?: string | undefined;
  override?: string | undefined;
}

export type SeedGuardResult =
  | { allowed: true; reason: 'local' | 'overridden' }
  | {
      allowed: false;
      reason: 'node_env_production' | 'connection_looks_production';
      message: string;
    };

/**
 * Whether seeding this target is permitted.
 *
 * Returns a result rather than throwing, so the decision can be asserted directly
 * without catching. Two independent checks, because either alone has a hole:
 * `NODE_ENV` is the documented guard and is trivially unset in a shell, and the
 * connection string check catches precisely that case.
 *
 * `NODE_ENV=production` is checked *before* the override, so the override cannot
 * enable seeding a database the environment itself declares to be production. The
 * override exists for a staging database that happens to carry a production-shaped
 * host name, not for production.
 */
export function evaluateSeedGuard(
  connectionString: string,
  environment: SeedGuardEnvironment,
): SeedGuardResult {
  if (environment.nodeEnv === 'production') {
    return {
      allowed: false,
      reason: 'node_env_production',
      message: 'Refusing to seed: NODE_ENV is production.',
    };
  }

  if (environment.override === SEED_OVERRIDE_VALUE) {
    return { allowed: true, reason: 'overridden' };
  }

  if (PRODUCTION_HINTS.test(connectionString)) {
    return {
      allowed: false,
      reason: 'connection_looks_production',
      message:
        'Refusing to seed: DATABASE_URL looks like a production database. ' +
        `Set CERA_ALLOW_SEED=${SEED_OVERRIDE_VALUE} to override.`,
    };
  }

  return { allowed: true, reason: 'local' };
}

/** Throws unless seeding is permitted. The form the CLI uses. */
export function assertSeedAllowed(
  connectionString: string,
  environment: SeedGuardEnvironment,
): void {
  const result = evaluateSeedGuard(connectionString, environment);

  if (!result.allowed) {
    throw new Error(result.message);
  }
}
