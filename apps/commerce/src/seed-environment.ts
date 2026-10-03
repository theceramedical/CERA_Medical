export interface SeedEnvironment {
  readonly CERA_ENV?: string;
  readonly NODE_ENV?: string;
  readonly CERA_ALLOW_PRODUCTION_CATALOGUE_SEED?: string;
}

/** Production catalogue changes are allowed only from the guarded deploy step. */
export function assertCatalogueSeedAllowed(env: SeedEnvironment): void {
  const production = env.CERA_ENV === 'production' || env.NODE_ENV === 'production';
  if (production && env.CERA_ALLOW_PRODUCTION_CATALOGUE_SEED !== 'approved') {
    throw new Error('Refusing to seed production without the deployment approval flag.');
  }
}
