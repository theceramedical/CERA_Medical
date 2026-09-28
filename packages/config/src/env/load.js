import { existsSync } from 'node:fs';
import { dirname, join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Loads the repository-root `.env` for scripts run directly on the host.
 *
 * Every error message in the repository says "copy .env.example to .env", and until
 * this existed that instruction was not true: nothing read the file. The scripts only
 * worked for someone who had also exported the variables into their shell, which is
 * an invisible prerequisite - and the failure it produces is `DATABASE_URL is not
 * set` immediately after you have created the file it names.
 *
 * Services running under Compose get their environment from Compose, and CI gets it
 * from the workflow, so neither has a `.env` to find. This is only for `pnpm migrate`
 * and friends invoked from a terminal.
 *
 * Variables already present in the environment always win - `loadEnvFile` does not
 * overwrite them. That ordering is the important part: a stale `.env` left in a
 * checkout must never be able to redirect a command that was given an explicit
 * `DATABASE_URL`, which is how a test run ends up writing to the wrong database.
 */
export function loadRootEnv(startDir = dirname(fileURLToPath(import.meta.url))) {
  const envPath = findRootEnv(startDir);

  if (envPath === undefined) return undefined;

  process.loadEnvFile(envPath);

  return envPath;
}

/**
 * Walks up from this file looking for the workspace root.
 *
 * Keyed on `pnpm-workspace.yaml` rather than a fixed number of `..` segments,
 * because this package is imported from `packages/*` and `apps/*` alike, and a
 * relative path that is correct for one is silently wrong for the other - it finds
 * no file and loads nothing, which looks exactly like having no `.env` at all.
 */
function findRootEnv(startDir) {
  let dir = startDir;
  const { root } = parse(dir);

  while (true) {
    if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
      const candidate = join(dir, '.env');

      return existsSync(candidate) ? candidate : undefined;
    }

    if (dir === root) return undefined;

    dir = dirname(dir);
  }
}
