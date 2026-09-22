import {
  auditEventFixtures,
  claimTokenFixtures,
  customerProfileFixtures,
  enquiryFixtures,
  enquiryStatusEventFixtures,
  FIXTURE_EMAIL_DOMAIN,
  FIXTURE_SUBJECT_PREFIX,
  integrationDeliveryFixtures,
  internalNoteFixtures,
  NON_PRODUCTION_EMAIL_SUFFIX,
  outboxFixtures,
  unmarkedAll,
} from '@cera/contracts/fixtures';
import { sql } from 'drizzle-orm';

import { createDatabase, type Database } from './client.ts';
import {
  auditEvents,
  customerProfiles,
  enquiries,
  enquiryClaimTokens,
  enquiryStatusEvents,
  integrationDeliveries,
  internalNotes,
  outbox,
} from './schema/index.ts';
import { assertSeedAllowed } from './seed-guard.ts';

/**
 * Loads the contract fixtures into `cera_app`.
 *
 * `pnpm seed` is idempotent: it can be run against a database that already has the
 * fixtures and changes nothing. That is not a convenience. A seed that fails on its
 * second run means every developer's first action after any error is to drop the
 * database, which makes "reset it and try again" the normal response to a problem
 * rather than reading what went wrong.
 *
 * `pnpm seed:reset` truncates first, for the case where the fixtures themselves
 * have changed shape.
 */

/** Order matters: parents before children, because of the foreign keys. */
const INSERT_ORDER = [
  'customer_profiles',
  'enquiries',
  'enquiry_status_events',
  'internal_notes',
  'integration_deliveries',
  'enquiry_claim_tokens',
  'outbox',
  'audit_events',
] as const;

/**
 * The reverse, for truncation.
 *
 * Written out rather than derived with `.reverse()`, because `reverse()` mutates in
 * place and a shared constant reversed once at module load is a bug that only
 * appears on the second call.
 */
const TRUNCATE_ORDER = [...INSERT_ORDER].reverse();

/**
 * Asserts the database holds no real data before touching it.
 *
 * The production guard above is about where we are pointed; this is about what is
 * already there. An enquiry with no fixture marker is a real person's enquiry, and
 * the correct response to finding one is to stop - not to add fixtures alongside it
 * and leave someone to work out later which rows are which.
 */
async function assertNoRealData(db: Database): Promise<void> {
  /**
   * Matches the shared non-production suffix, not the fixture domain alone.
   *
   * The database integration tests create rows at `test.cera.invalid`. Those are not
   * fixtures and must not be deleted by a reset, but they are also not a real
   * person's enquiry - and treating them as one would make `pnpm seed` refuse to run
   * on any machine where the test suite had been executed, which is every machine.
   */
  const result = await db.execute<{ count: string }>(sql`
    select count(*)::text as count
    from enquiries
    where email not like ${'%' + NON_PRODUCTION_EMAIL_SUFFIX}
  `);

  const realEnquiries = Number(result.rows[0]?.count ?? '0');

  if (realEnquiries > 0) {
    throw new Error(
      `Refusing to seed: found ${String(realEnquiries)} enquiries that are not fixtures. ` +
        'This database holds real data.',
    );
  }
}

/**
 * Deletes every fixture row, children first.
 *
 * `DELETE` scoped to the fixture markers rather than `TRUNCATE`. Three reasons, and
 * the first is decisive: `TRUNCATE` is blocked on `enquiry_status_events` and
 * `audit_events` by the append-only triggers, so it would fail. It would also
 * remove any non-fixture row, which is exactly what `assertNoRealData` exists to
 * prevent, and it needs a table-level lock that a concurrently running API holds up.
 */
async function deleteFixtures(db: Database): Promise<void> {
  const fixtureSubjects = `${FIXTURE_SUBJECT_PREFIX}%`;
  const fixtureEmails = `%@${FIXTURE_EMAIL_DOMAIN}`;

  /**
   * The append-only triggers reject `DELETE` as well as `UPDATE` - that is the point
   * of them - so a reset has to turn them off for the duration.
   *
   * `ALTER TABLE ... DISABLE TRIGGER` rather than `SET session_replication_role`,
   * which is the obvious alternative and does not work: that GUC is superuser-only,
   * and `cera_app` is deliberately not a superuser. Disabling a named trigger needs
   * only table ownership, which the role that ran the migrations has.
   *
   * The distinction is worth stating because it is the guarantee: no amount of
   * application-level access lets a caller bypass these triggers. Rewriting history
   * requires the role that owns the table, which is a deliberate administrative act
   * and is not what the API connects as.
   */
  await db.execute(
    sql`alter table enquiry_status_events disable trigger enquiry_status_events_append_only`,
  );
  await db.execute(sql`alter table audit_events disable trigger audit_events_append_only`);

  try {
    await deleteFixtureRows(db, fixtureEmails, fixtureSubjects);
  } finally {
    // Re-enabled in a `finally`, so a failed delete cannot leave the audit trail
    // mutable - which would be a far worse outcome than a failed reset.
    await db.execute(
      sql`alter table enquiry_status_events enable trigger enquiry_status_events_append_only`,
    );
    await db.execute(sql`alter table audit_events enable trigger audit_events_append_only`);
  }
}

async function deleteFixtureRows(
  db: Database,
  fixtureEmails: string,
  fixtureSubjects: string,
): Promise<void> {
  for (const table of TRUNCATE_ORDER) {
    switch (table) {
      case 'audit_events':
        await db.execute(
          sql`delete from audit_events where request_id like ${'fixture-request-%'}`,
        );
        break;
      case 'outbox':
        // Keyed by `aggregate_id`, not `enquiry_id`: the outbox is generic over
        // aggregate types so that something other than an enquiry can produce work
        // later, and that generality means it does not share the children's column.
        await db.execute(
          sql`delete from outbox
              where aggregate_id in (
                select id from enquiries where email like ${fixtureEmails}
              )`,
        );
        break;
      case 'customer_profiles':
        await db.execute(
          sql`delete from customer_profiles
              where email like ${fixtureEmails} or subject_id like ${fixtureSubjects}`,
        );
        break;
      case 'enquiries':
        await db.execute(sql`delete from enquiries where email like ${fixtureEmails}`);
        break;
      /**
       * The enquiry's children, all keyed by `enquiry_id`.
       *
       * Listed explicitly rather than handled by a `default`, so adding a table to
       * `INSERT_ORDER` fails the exhaustiveness check instead of silently being
       * deleted by a column it may not have - which is the mistake `outbox` already
       * caused once, and which surfaced as a query error rather than as missed rows
       * only because that column genuinely does not exist.
       *
       * They are removed by their parent rather than by a marker of their own: none
       * has an email or subject column, and inventing one purely to support the
       * seeder would put a test concern into the production schema.
       */
      case 'enquiry_status_events':
      case 'internal_notes':
      case 'integration_deliveries':
      case 'enquiry_claim_tokens':
        await db.execute(
          sql`delete from ${sql.identifier(table)}
              where enquiry_id in (
                select id from enquiries where email like ${fixtureEmails}
              )`,
        );
        break;
    }
  }
}

/**
 * Inserts every fixture, ignoring rows that are already there.
 *
 * `onConflictDoNothing` on the primary key is what makes a second run a no-op.
 * Deliberately not `onConflictDoUpdate`: an update would silently repair a row a
 * test had modified, which turns "the test left the database dirty" from a failure
 * into a mystery in whichever test runs next.
 */
async function insertFixtures(db: Database): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  /**
   * One transaction for all eight tables.
   *
   * Not eight separate inserts: the children reference their parents with
   * `ON DELETE RESTRICT`, so a failure partway through would leave enquiries with a
   * partial status history and no way to remove them without an owner-level session.
   * Either the whole set lands or none of it does.
   *
   * No trigger suspension is needed here. Every trigger on these tables is
   * `BEFORE UPDATE`, `DELETE`, or `TRUNCATE` - an insert fires none of them, so the
   * fixtures' own `created_at` and `updated_at` values are written as given.
   */
  await db.transaction(async (tx) => {
    counts.customer_profiles = (
      await tx
        .insert(customerProfiles)
        .values(unmarkedAll(customerProfileFixtures))
        .onConflictDoNothing()
        .returning({ subjectId: customerProfiles.subjectId })
    ).length;

    counts.enquiries = (
      await tx
        .insert(enquiries)
        .values(unmarkedAll(enquiryFixtures))
        .onConflictDoNothing()
        .returning({ id: enquiries.id })
    ).length;

    counts.enquiry_status_events = (
      await tx
        .insert(enquiryStatusEvents)
        .values(unmarkedAll(enquiryStatusEventFixtures))
        .onConflictDoNothing()
        .returning({ id: enquiryStatusEvents.id })
    ).length;

    counts.internal_notes = (
      await tx
        .insert(internalNotes)
        .values(unmarkedAll(internalNoteFixtures))
        .onConflictDoNothing()
        .returning({ id: internalNotes.id })
    ).length;

    counts.integration_deliveries = (
      await tx
        .insert(integrationDeliveries)
        .values(unmarkedAll(integrationDeliveryFixtures))
        .onConflictDoNothing()
        .returning({ id: integrationDeliveries.id })
    ).length;

    counts.enquiry_claim_tokens = (
      await tx
        .insert(enquiryClaimTokens)
        .values(unmarkedAll(claimTokenFixtures))
        .onConflictDoNothing()
        .returning({ id: enquiryClaimTokens.id })
    ).length;

    counts.outbox = (
      await tx
        .insert(outbox)
        .values(unmarkedAll(outboxFixtures))
        .onConflictDoNothing()
        .returning({ id: outbox.id })
    ).length;

    counts.audit_events = (
      await tx
        .insert(auditEvents)
        .values(unmarkedAll(auditEventFixtures))
        .onConflictDoNothing()
        .returning({ id: auditEvents.id })
    ).length;
  });

  return counts;
}

async function main(): Promise<void> {
  const reset = process.argv.includes('--reset');
  const connectionString = process.env.DATABASE_URL;

  if (connectionString === undefined || connectionString.length === 0) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
    process.exitCode = 1;
    return;
  }

  const handle = createDatabase({
    connectionString,
    maxConnections: 1,
    application: 'cera-seed',
  });

  try {
    assertSeedAllowed(connectionString, {
      nodeEnv: process.env.NODE_ENV,
      override: process.env.CERA_ALLOW_SEED,
    });
    await assertNoRealData(handle.db);

    if (reset) {
      await deleteFixtures(handle.db);
      console.log('Removed existing fixture rows.');
    }

    const counts = await insertFixtures(handle.db);
    const inserted = Object.values(counts).reduce((total, count) => total + count, 0);

    for (const table of INSERT_ORDER) {
      console.log(`  ${table.padEnd(24)} ${String(counts[table] ?? 0)} inserted`);
    }

    console.log(
      inserted === 0
        ? 'Nothing to do: the fixtures are already loaded.'
        : `Seeded ${String(inserted)} rows.`,
    );
  } catch (error) {
    console.error('Seed failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await handle.close();
  }
}

await main();
