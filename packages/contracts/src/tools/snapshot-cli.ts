import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildSnapshot, compareSnapshots, type SchemaSnapshot } from './snapshot.ts';

/**
 * Writes or checks the committed contract snapshot.
 *
 * `--check` is what CI runs. It compares the committed snapshot against the schemas as
 * they are now and fails only on a change that would break a caller that has not been
 * redeployed.
 *
 * The snapshot is committed rather than derived from git history on the fly. Reading
 * the previous version out of git would make the check depend on the checkout depth and
 * on which branch CI compared against, and both of those are the kind of thing that
 * quietly stops working and leaves a green check that verifies nothing.
 */

const SNAPSHOT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'contract-snapshot.json',
);

/**
 * The escape hatch, for a deliberate breaking change.
 *
 * Breaking changes are legitimate - PRD 10 requires only that no destructive change
 * ships in a single release. The point of the gate is that the break is a decision
 * somebody made and wrote down, not something noticed after a deploy. Setting this
 * means committing the new snapshot, which puts the break in the diff.
 */
const OVERRIDE = 'CERA_ALLOW_BREAKING_CONTRACT_CHANGE';

async function readCommittedSnapshot(): Promise<SchemaSnapshot | undefined> {
  const raw = await readFile(SNAPSHOT_PATH, 'utf8').catch(() => undefined);

  return raw === undefined ? undefined : (JSON.parse(raw) as SchemaSnapshot);
}

async function main(): Promise<void> {
  const check = process.argv.includes('--check');
  const current = buildSnapshot();
  const schemaCount = Object.keys(current.schemas).length;

  if (!check) {
    // Two-space indentation and a trailing newline, so the file is reviewable in a
    // diff. A single-line JSON snapshot would make every change one enormous line.
    await writeFile(SNAPSHOT_PATH, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
    console.log(`Wrote contract snapshot: ${String(schemaCount)} schemas.`);
    return;
  }

  const committed = await readCommittedSnapshot();

  if (committed === undefined) {
    console.error('No contract snapshot found. Run `pnpm --filter @cera/contracts snapshot`.');
    process.exitCode = 1;
    return;
  }

  const breaks = compareSnapshots(committed, current);

  if (breaks.length === 0) {
    const added = schemaCount - Object.keys(committed.schemas).length;

    console.log(
      `No breaking contract changes. ${String(schemaCount)} schemas` +
        (added > 0 ? `, ${String(added)} added since the snapshot.` : '.'),
    );

    // Additions still need the snapshot refreshed, or the next change is compared
    // against a stale baseline and a removal of something added in between goes
    // unnoticed. A warning rather than a failure: it is not itself a break.
    if (JSON.stringify(committed) !== JSON.stringify(current)) {
      console.warn(
        'The snapshot is out of date (additive changes only). ' +
          'Run `pnpm --filter @cera/contracts snapshot` and commit the result.',
      );
    }
    return;
  }

  console.error(`Found ${String(breaks.length)} breaking contract change(s):\n`);

  for (const breakage of breaks) {
    console.error(`  [${breakage.kind}] ${breakage.at}`);
    console.error(`      ${breakage.detail}\n`);
  }

  if (process.env[OVERRIDE] === 'true') {
    console.warn(`${OVERRIDE} is set. Allowing the break.`);
    console.warn('Run `pnpm --filter @cera/contracts snapshot` and commit the new snapshot.');
    return;
  }

  console.error(
    'A client that has not been redeployed will fail against these changes.\n' +
      'If the break is intended, expand the contract first and remove the old shape in a\n' +
      `later release (PRD 10), or set ${OVERRIDE}=true and commit the refreshed snapshot.`,
  );
  process.exitCode = 1;
}

await main();
