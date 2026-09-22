import { generateEnquiryReference } from '@cera/contracts/primitives';
import { sql } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase, type DatabaseHandle } from '../client.ts';
import {
  auditEvents,
  enquiries,
  enquiryStatusEvents,
  internalNotes,
  outbox,
} from '../schema/index.ts';

/**
 * Constraint and trigger behaviour against a real Postgres.
 *
 * These cannot be unit tests. A check constraint that drizzle-kit declares and
 * fails to emit, a trigger that compiles and never fires, a partial index whose
 * predicate Postgres rejects - all three look correct in TypeScript and are absent
 * from the database. The only way to know the guarantees exist is to try to break
 * them.
 *
 * Skipped rather than failed when `DATABASE_URL` is unset, so a fresh checkout
 * without Docker still runs the rest of the suite. CI always sets it, so the skip
 * cannot hide a regression there.
 */

const connectionString = process.env.DATABASE_URL;
const describeWithDb = connectionString === undefined ? describe.skip : describe;

/**
 * Asserts that a database operation fails, and that the *Postgres* message
 * matches.
 *
 * Needed because Drizzle wraps driver errors: the thrown object's `message` is
 * only `Failed query: insert into ...`, and the constraint name, the SQLSTATE, and
 * any `RAISE EXCEPTION` text are on `error.cause`. A plain
 * `rejects.toThrow(/enquiries_reference_key/)` therefore fails even when the
 * constraint fired exactly as intended - a false negative of the kind that gets a
 * real assertion weakened or deleted.
 *
 * This matters beyond these tests. The error classifier in `apps/api` must read
 * `cause` to tell a unique violation it should retry (a reference collision) from a
 * check violation it must not (an over-long message). Recorded here because this is
 * where the behaviour was found.
 */
async function expectDbFailure(operation: Promise<unknown>, pattern: RegExp): Promise<void> {
  let thrown: unknown;

  try {
    await operation;
  } catch (error) {
    thrown = error;
  }

  expect(thrown, 'expected the database to reject this operation').toBeDefined();

  const chain: string[] = [];
  let current: unknown = thrown;

  while (current instanceof Error) {
    chain.push(current.message);
    current = current.cause;
  }

  expect(chain.join('\n')).toMatch(pattern);
}

describeWithDb('constraints and triggers', () => {
  let handle: DatabaseHandle;

  /** A valid enquiry, so each test changes exactly the one thing it is about. */
  const validEnquiry = () => ({
    id: uuidv7(),
    reference: generateEnquiryReference(),
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    serviceId: 'svc-knee-replacement',
    message: 'I would like to discuss a consultation for a knee replacement.',
    consentAt: new Date().toISOString(),
    source: 'web_service_page' as const,
  });

  const insertEnquiry = async (overrides: Record<string, unknown> = {}) => {
    const row = { ...validEnquiry(), ...overrides };
    await handle.db.insert(enquiries).values(row as never);
    return row;
  };

  const seedStatusEvent = async () => {
    const enquiry = await insertEnquiry();
    const id = uuidv7();

    await handle.db.insert(enquiryStatusEvents).values({
      id,
      enquiryId: enquiry.id,
      previousStatus: null,
      newStatus: 'received',
      customerStatus: 'received',
      actorSubjectId: null,
      reason: null,
    });

    return { id, enquiryId: enquiry.id };
  };

  const seedAuditEvent = async () => {
    const id = uuidv7();

    await handle.db.insert(auditEvents).values({
      id,
      actorSubjectId: 'authentik-subject-staff-1',
      action: 'enquiry.created',
      targetType: 'enquiry',
      targetId: uuidv7(),
      safeDiff: null,
      requestId: 'req-test-1',
    });

    return { id };
  };

  beforeAll(async () => {
    handle = createDatabase({
      connectionString: connectionString ?? '',
      maxConnections: 4,
      application: 'cera-db-tests',
    });

    // Fail loudly and early if migrations have not been applied, rather than
    // reporting forty confusing "relation does not exist" failures.
    await handle.db.execute(sql`select 1 from enquiries limit 0`);
  });

  afterAll(async () => {
    await handle?.close();
  });

  describe('enquiries', () => {
    it('accepts a valid enquiry', async () => {
      await expect(insertEnquiry()).resolves.toBeDefined();
    });

    it('rejects a duplicate reference', async () => {
      const first = await insertEnquiry();

      await expectDbFailure(
        insertEnquiry({ reference: first.reference }),
        /enquiries_reference_key/,
      );
    });

    it('rejects an enquiry with no recorded consent', async () => {
      // The enforcement point for PRD 10. An application check could be bypassed
      // by an import or a backfill; this cannot.
      await expectDbFailure(insertEnquiry({ consentAt: null }), /consent_at/);
    });

    it('rejects a message below the minimum', async () => {
      await expectDbFailure(insertEnquiry({ message: 'hi' }), /enquiries_message_length_check/);
    });

    it('rejects a message above the maximum', async () => {
      await expectDbFailure(
        insertEnquiry({ message: 'x'.repeat(2001) }),
        /enquiries_message_length_check/,
      );
    });

    it('accepts a message at exactly the boundaries', async () => {
      await expect(insertEnquiry({ message: 'x'.repeat(10) })).resolves.toBeDefined();
      await expect(insertEnquiry({ message: 'x'.repeat(2000) })).resolves.toBeDefined();
    });

    it('rejects consent recorded in the future', async () => {
      const future = new Date(Date.now() + 60_000).toISOString();

      await expectDbFailure(
        insertEnquiry({ consentAt: future, createdAt: new Date().toISOString() }),
        /enquiries_consent_not_future_check/,
      );
    });

    it('refuses to change a reference once issued', async () => {
      // Customers quote it and Zoho stores it, so a reference that changes makes
      // two records impossible to reconcile.
      const row = await insertEnquiry();

      await expectDbFailure(
        handle.db.execute(
          sql`update enquiries set reference = 'CERA-260101-AAAAA' where id = ${row.id}`,
        ),
        /immutable/,
      );
    });

    it('maintains updated_at without the caller setting it', async () => {
      const row = await insertEnquiry();
      const before = await handle.db.execute(
        sql`select updated_at from enquiries where id = ${row.id}`,
      );

      await handle.db.execute(
        sql`update enquiries set internal_status = 'triaging' where id = ${row.id}`,
      );

      const after = await handle.db.execute(
        sql`select updated_at from enquiries where id = ${row.id}`,
      );

      expect(after.rows[0]?.updated_at).not.toEqual(before.rows[0]?.updated_at);
    });

    it('defaults a new enquiry to received', async () => {
      const row = await insertEnquiry();
      const result = await handle.db.execute(
        sql`select internal_status from enquiries where id = ${row.id}`,
      );

      expect(result.rows[0]?.internal_status).toBe('received');
    });

    it('rejects a status outside the enum', async () => {
      await expectDbFailure(insertEnquiry({ internalStatus: 'probably_fine' }), /internal_status/);
    });

    it('rejects a name below the minimum length', async () => {
      await expectDbFailure(insertEnquiry({ name: 'A' }), /enquiries_name_length_check/);
    });
  });

  describe('append-only tables', () => {
    it('allows an insert into enquiry_status_events', async () => {
      await expect(seedStatusEvent()).resolves.toBeDefined();
    });

    it('rejects an update to a status event', async () => {
      const { id } = await seedStatusEvent();

      await expectDbFailure(
        handle.db.execute(sql`update enquiry_status_events set reason = 'edited' where id = ${id}`),
        /append-only/,
      );
    });

    it('rejects a delete from a status event', async () => {
      const { id } = await seedStatusEvent();

      await expectDbFailure(
        handle.db.execute(sql`delete from enquiry_status_events where id = ${id}`),
        /append-only/,
      );
    });

    it('rejects an update to an audit event', async () => {
      const { id } = await seedAuditEvent();

      await expectDbFailure(
        handle.db.execute(
          sql`update audit_events set action = 'enquiry.tampered' where id = ${id}`,
        ),
        /append-only/,
      );
    });

    it('rejects a delete from an audit event', async () => {
      const { id } = await seedAuditEvent();

      await expectDbFailure(
        handle.db.execute(sql`delete from audit_events where id = ${id}`),
        /append-only/,
      );
    });

    it('rejects a delete that would match no rows', async () => {
      // The statement-level trigger is what makes this true. A row-level trigger
      // would report success here, so a `DELETE FROM audit_events WHERE ...` that
      // happened to match nothing would look permitted - and the next one, with a
      // predicate that did match, would be a surprise.
      await expectDbFailure(
        handle.db.execute(sql`delete from audit_events where request_id = 'no-such-request'`),
        /append-only/,
      );
    });

    it('rejects TRUNCATE on audit_events, which is not a DELETE', async () => {
      // A DELETE-only trigger would let one statement erase the entire trail.
      await expectDbFailure(handle.db.execute(sql`truncate audit_events`), /append-only/);
    });

    it('rejects TRUNCATE on enquiry_status_events', async () => {
      await expectDbFailure(handle.db.execute(sql`truncate enquiry_status_events`), /append-only/);
    });

    it('reports the refusal as insufficient_privilege, not as a constraint violation', async () => {
      // SQLSTATE 42501. A client library then surfaces it as a permissions error
      // rather than something a retry might clear.
      const { id } = await seedAuditEvent();
      let code: unknown;

      try {
        await handle.db.execute(sql`delete from audit_events where id = ${id}`);
      } catch (error) {
        let current: unknown = error;
        while (current instanceof Error && code === undefined) {
          code = (current as { code?: unknown }).code;
          current = current.cause;
        }
      }

      expect(code).toBe('42501');
    });

    it('rejects a self-transition, which would say nothing changed', async () => {
      const enquiry = await insertEnquiry();

      await expectDbFailure(
        handle.db.insert(enquiryStatusEvents).values({
          id: uuidv7(),
          enquiryId: enquiry.id,
          previousStatus: 'triaging',
          newStatus: 'triaging',
          customerStatus: 'in_review',
          actorSubjectId: null,
          reason: null,
        }),
        /no_self_transition/,
      );
    });

    it('rejects an action name that is not a dotted lower-case path', async () => {
      await expectDbFailure(
        handle.db.insert(auditEvents).values({
          id: uuidv7(),
          actorSubjectId: null,
          action: 'Enquiry Created',
          targetType: 'enquiry',
          targetId: uuidv7(),
          safeDiff: null,
          requestId: 'req-test-2',
        }),
        /action_shape_check/,
      );
    });
  });

  describe('internal_notes is deliberately mutable', () => {
    it('allows an edit, and records that it happened', async () => {
      const enquiry = await insertEnquiry();
      const id = uuidv7();

      await handle.db.insert(internalNotes).values({
        id,
        enquiryId: enquiry.id,
        authorSubjectId: 'authentik-subject-staff-1',
        body: 'Called, left a voicemail.',
      });

      const editedAt = new Date().toISOString();

      await expect(
        handle.db.execute(
          sql`update internal_notes set body = 'Called, spoke to them.', edited_at = ${editedAt} where id = ${id}`,
        ),
      ).resolves.toBeDefined();
    });

    it('rejects an edit timestamp before creation', async () => {
      const enquiry = await insertEnquiry();
      const id = uuidv7();

      await handle.db.insert(internalNotes).values({
        id,
        enquiryId: enquiry.id,
        authorSubjectId: 'authentik-subject-staff-1',
        body: 'Note.',
      });

      await expectDbFailure(
        handle.db.execute(
          sql`update internal_notes set edited_at = '2020-01-01T00:00:00.000Z' where id = ${id}`,
        ),
        /edited_after_created/,
      );
    });
  });

  describe('referential integrity', () => {
    it('refuses to delete an enquiry that has history', async () => {
      // The audit trail is the reason. A cascade would mean deleting one row
      // erases the record that it ever existed or was acted on.
      //
      // The message says "violates RESTRICT setting", not the generic "violates
      // foreign key constraint" that NO ACTION produces. That wording is the
      // assertion: RESTRICT is checked immediately and cannot be deferred to the
      // end of the transaction, so a `SET CONSTRAINTS ALL DEFERRED` before a bulk
      // delete cannot slip past it. NO ACTION can be.
      const { enquiryId } = await seedStatusEvent();

      await expectDbFailure(
        handle.db.execute(sql`delete from enquiries where id = ${enquiryId}`),
        /violates RESTRICT setting of foreign key constraint/,
      );
    });

    it('rejects a status event for an enquiry that does not exist', async () => {
      await expectDbFailure(
        handle.db.insert(enquiryStatusEvents).values({
          id: uuidv7(),
          enquiryId: uuidv7(),
          previousStatus: null,
          newStatus: 'received',
          customerStatus: 'received',
          actorSubjectId: null,
          reason: null,
        }),
        /violates foreign key constraint/,
      );
    });
  });

  describe('outbox', () => {
    const insertOutbox = (overrides: Record<string, unknown> = {}) =>
      handle.db.insert(outbox).values({
        id: uuidv7(),
        aggregateType: 'enquiry',
        aggregateId: uuidv7(),
        eventType: 'enquiry.created',
        payload: { enquiryId: uuidv7() },
        ...overrides,
      } as never);

    it('accepts a pending row with no lock', async () => {
      await expect(insertOutbox()).resolves.toBeDefined();
    });

    it('rejects a lock timestamp with no holder', async () => {
      // A row that looks claimed and cannot be attributed leaves the reaper unable
      // to decide whether the holder is still alive.
      await expectDbFailure(
        insertOutbox({ lockedAt: new Date().toISOString() }),
        /lock_consistency/,
      );
    });

    it('rejects a holder with no lock timestamp', async () => {
      await expectDbFailure(insertOutbox({ lockedBy: 'worker-1' }), /lock_consistency/);
    });

    it('accepts a complete lock', async () => {
      await expect(
        insertOutbox({ lockedAt: new Date().toISOString(), lockedBy: 'worker-1' }),
      ).resolves.toBeDefined();
    });

    it('supports the claim query the worker will run', async () => {
      // `for update skip locked` is what lets two workers sweep concurrently
      // without either waiting on the other or both taking the same row. Proving
      // it runs against the real partial index now avoids discovering in Phase 10
      // that the index predicate does not match the query.
      await insertOutbox();

      const claimed = await handle.db.execute(sql`
        select id from outbox
        where status = 'pending' and available_at <= now()
        order by available_at
        limit 5
        for update skip locked
      `);

      expect(claimed.rows.length).toBeGreaterThan(0);
    });

    it('uses the partial index for the sweep rather than a sequential scan', async () => {
      // The index exists to keep the sweep cheap as completed rows accumulate. If
      // the planner ignores it, the sweep is a full scan on a timer - which is
      // exactly the unbounded query the performance budget rules out.
      const plan = await handle.db.execute(sql`
        explain (format text)
        select id from outbox
        where status = 'pending' and available_at <= now()
        order by available_at
        limit 5
      `);

      const text = plan.rows.map((row) => String(row['QUERY PLAN'])).join('\n');

      // Postgres may legitimately prefer a sequential scan on a tiny table, so
      // this asserts the index is *usable*, by disabling the alternative.
      await handle.db.execute(sql`set local enable_seqscan = off`);

      const forced = await handle.db.execute(sql`
        explain (format text)
        select id from outbox
        where status = 'pending' and available_at <= now()
        order by available_at
        limit 5
      `);

      const forcedText = forced.rows.map((row) => String(row['QUERY PLAN'])).join('\n');

      expect(text.length).toBeGreaterThan(0);
      expect(forcedText).toContain('outbox_pending_available_idx');
    });
  });
});
