/**
 * Loads the repository-root `.env` if there is one, without overwriting variables
 * already set in the environment.
 *
 * @returns the path that was loaded, or `undefined` if no `.env` was found.
 */
export declare function loadRootEnv(startDir?: string): string | undefined;
