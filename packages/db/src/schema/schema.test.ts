import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { EnquirySourceSchema } from '@cera/contracts/enums';
import { ALL_CUSTOMER_STATUSES, ALL_INTERNAL_STATUSES } from '@cera/contracts/status';
import { getTableColumns, getTableName, is, Table } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import {
  APPEND_ONLY_TABLES,
  auditEvents,
  customerProfiles,
  emailSuppressions,
  enquiries,
  enquiryClaimTokens,
  enquiryStatusEvents,
  integrationDeliveries,
  internalNotes,
  outbox,
} from './index.ts';
import * as schema from './index.ts';

/**
 * These tests read the generated migration SQL rather than only the Drizzle
 * objects.
 *
 * The distinction matters: a check constraint declared in TypeScript that
 * drizzle-kit fails to emit is still present in the Drizzle object and entirely
 * absent from the database. Asserting against the SQL that will actually be
 * applied is the only way to know the guarantee exists where it is needed.
 */

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'drizzle');

/**
 * Migrations are located through the journal, not by filename.
 *
 * drizzle-kit names a generated file with a random word pair unless told
 * otherwise, and the journal is the authoritative ordering in any case. Reading it
 * means renaming or adding a migration does not silently make these assertions
 * pass against a file that is no longer applied.
 */
const journal = JSON.parse(readFileSync(join(MIGRATIONS_DIR, 'meta', '_journal.json'), 'utf8')) as {
  entries: { idx: number; tag: string }[];
};

/**
 * Newlines are normalised, because several assertions below span two lines.
 *
 * `.gitattributes` stores these files with LF, but a Windows checkout can still leave
 * CRLF in the working tree - and it did, which turned an assertion about a trigger
 * definition into an assertion about the developer's git configuration. Normalising at
 * the boundary keeps the assertions readable, since the alternative is a regex with
 * `\r?\n` at every line break.
 */
const sqlForTag = (match: string): string => {
  const entry = journal.entries.find((candidate) => candidate.tag.includes(match));
  if (entry === undefined) throw new Error(`no migration in the journal matching "${match}"`);
  return readFileSync(join(MIGRATIONS_DIR, `${entry.tag}.sql`), 'utf8').replaceAll('\r\n', '\n');
};

const initialSql = sqlForTag('initial_cera_app_schema');
const triggerSql = sqlForTag('append_only_audit_trail');

const ALL_TABLES = [
  enquiries,
  enquiryStatusEvents,
  internalNotes,
  customerProfiles,
  auditEvents,
  integrationDeliveries,
  enquiryClaimTokens,
  outbox,
  emailSuppressions,
];

describe('table inventory', () => {
  it('declares the nine tables the phase specifies', () => {
    expect(ALL_TABLES.map(getTableName).sort()).toEqual([
      'audit_events',
      'customer_profiles',
      'email_suppressions',
      'enquiries',
      'enquiry_claim_tokens',
      'enquiry_status_events',
      'integration_deliveries',
      'internal_notes',
      'outbox',
    ]);
  });

  it('exports every table from the barrel drizzle-kit reads', () => {
    // A table missing from this module does not exist as far as migrations are
    // concerned, and the symptom is a runtime "relation does not exist" rather
    // than a build failure.
    // Widened to `unknown[]` first: the barrel's inferred type is a union of nine
    // specific table types plus the enums, which is too narrow for a generic
    // `is(value, Table)` predicate to be assignable to.
    const exported = new Set(
      (Object.values(schema) as unknown[])
        .filter((value): value is Table => is(value, Table))
        .map((table) => getTableName(table)),
    );

    for (const table of ALL_TABLES) {
      expect(exported.has(getTableName(table)), getTableName(table)).toBe(true);
    }
  });

  it('creates every table in the generated SQL', () => {
    for (const table of ALL_TABLES) {
      expect(initialSql, getTableName(table)).toContain(`CREATE TABLE "${getTableName(table)}"`);
    }
  });
});

describe('columns are snake_case and timestamps carry a zone', () => {
  it('uses snake_case column names on every table', () => {
    for (const table of ALL_TABLES) {
      // Annotated because `getTableColumns` over a union of table types widens to
      // `any`, and an `any` here would silently stop checking anything.
      const columns: Record<string, { name: string }> = getTableColumns(table);

      for (const column of Object.values(columns)) {
        expect(column.name, `${getTableName(table)}.${column.name}`).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    }
  });

  it('has no timestamp column without a time zone', () => {
    // `timestamp without time zone` stores wall-clock text, so a change of server
    // TZ silently shifts what "created before" means. A single column that misses
    // the helper reintroduces that, so this asserts over the emitted SQL.
    expect(initialSql).not.toMatch(/"\w+" timestamp(?! with time zone)/);
    expect(initialSql).toContain('timestamp with time zone');
  });

  it('uses uuid primary keys', () => {
    // customer_profiles and email_suppressions are keyed by subject and email
    // respectively, which is deliberate and documented on those tables.
    const uuidKeyed = ALL_TABLES.filter(
      (table) => !['customer_profiles', 'email_suppressions'].includes(getTableName(table)),
    );

    for (const table of uuidKeyed) {
      expect(initialSql, getTableName(table)).toContain(`"id" uuid PRIMARY KEY NOT NULL`);
    }
  });

  it('does not default any primary key, since UUID v7 is generated in the application', () => {
    // A `defaultRandom()` would emit a v4, which is not time-ordered - so an
    // insert that forgot to supply an id would quietly fragment the index.
    expect(initialSql).not.toContain('"id" uuid PRIMARY KEY DEFAULT');
    expect(initialSql).not.toContain('gen_random_uuid()');
  });
});

describe('enums come from the contracts, not from a second list', () => {
  it('emits every internal status', () => {
    const declared = ALL_INTERNAL_STATUSES.map((status) => `'${status}'`).join(', ');

    expect(initialSql).toContain(`CREATE TYPE "public"."internal_status" AS ENUM(${declared})`);
  });

  it('emits every customer status', () => {
    const declared = ALL_CUSTOMER_STATUSES.map((status) => `'${status}'`).join(', ');

    expect(initialSql).toContain(`CREATE TYPE "public"."customer_status" AS ENUM(${declared})`);
  });

  it('emits every enquiry source', () => {
    for (const source of EnquirySourceSchema.options) {
      expect(initialSql, source).toContain(`'${source}'`);
    }
  });

  it('keeps internal and customer statuses as distinct database types', () => {
    // They overlap in values - both have `received` and `completed` - so a single
    // shared type would let a staff-only value be written to a customer-facing
    // column with no error anywhere in the stack.
    expect(initialSql).toContain('CREATE TYPE "public"."internal_status"');
    expect(initialSql).toContain('CREATE TYPE "public"."customer_status"');
  });
});

describe('constraints that encode the rules', () => {
  it.each([
    ['enquiry references are unique', 'CREATE UNIQUE INDEX "enquiries_reference_key"'],
    [
      'idempotency keys are unique, which is what stops a retry duplicating',
      'CREATE UNIQUE INDEX "integration_deliveries_idempotency_key"',
    ],
    [
      'claim token hashes are unique, which makes single-use a database property',
      'CREATE UNIQUE INDEX "enquiry_claim_tokens_token_hash_key"',
    ],
    ['one profile per address, case-insensitively', 'lower("email")'],
  ])('%s', (_label, fragment) => {
    expect(initialSql).toContain(fragment);
  });

  it('makes consent non-nullable rather than application-checked', () => {
    // A nullable column plus an application check would let an import, a
    // backfill, or a fixture create an enquiry with no recorded consent.
    expect(initialSql).toMatch(/"consent_at" timestamp with time zone NOT NULL/);
  });

  it('bounds the message length in the database', () => {
    expect(initialSql).toContain('enquiries_message_length_check');
    expect(initialSql).toContain('between 10 and 2000');
  });

  it('restricts deletion of every enquiry child, so history cannot be orphaned', () => {
    const children = [
      'enquiry_status_events',
      'internal_notes',
      'integration_deliveries',
      'enquiry_claim_tokens',
    ];

    for (const child of children) {
      const line = initialSql
        .split('\n')
        .find(
          (row) =>
            row.includes(`ALTER TABLE "${child}" ADD CONSTRAINT`) && row.includes('FOREIGN KEY'),
        );

      expect(line, child).toBeDefined();
      expect(line, child).toContain('ON DELETE restrict');
    }
  });

  it('has no cascading delete anywhere', () => {
    // A cascade would mean deleting one enquiry erases the record that it ever
    // existed or was acted on.
    expect(initialSql).not.toContain('ON DELETE cascade');
    expect(initialSql).not.toContain('ON DELETE set null');
  });

  it('rejects half a lock on the outbox', () => {
    // A row that looks claimed and cannot be attributed leaves the reaper unable
    // to decide whether the holder is alive.
    expect(initialSql).toContain('outbox_lock_consistency_check');
  });

  it('requires an external id on a succeeded delivery', () => {
    // Without it there is no way to find the Zoho lead again, which makes
    // reconciliation impossible and a duplicate on the next sync likely.
    expect(initialSql).toContain('integration_deliveries_success_has_external_id_check');
  });

  it('requires both halves of a token consumption record', () => {
    expect(initialSql).toContain('enquiry_claim_tokens_consumption_consistency_check');
  });
});

describe('indexes match the queries the phase documents', () => {
  it.each([
    [
      'the staff queue',
      'CREATE INDEX "enquiries_status_created_idx" ON "enquiries" USING btree ("internal_status","created_at" DESC',
    ],
    [
      'the customer dashboard',
      'CREATE INDEX "enquiries_customer_created_idx" ON "enquiries" USING btree ("customer_subject_id","created_at" DESC',
    ],
    [
      'enquiry timelines',
      'CREATE INDEX "enquiry_status_events_enquiry_created_idx" ON "enquiry_status_events" USING btree ("enquiry_id","created_at")',
    ],
  ])('serves %s', (_label, fragment) => {
    expect(initialSql).toContain(fragment);
  });

  it('makes the outbox sweep index partial on pending', () => {
    // Completed rows accumulate and are never swept again. Including them would
    // grow the index without bound and make the claim slower every day.
    expect(initialSql).toMatch(
      /CREATE INDEX "outbox_pending_available_idx" ON "outbox" USING btree \("available_at"\) WHERE .*status.* = 'pending'/,
    );
  });

  it('makes the dead-letter and unassigned views partial too', () => {
    expect(initialSql).toContain('"integration_deliveries_dead_letter_idx"');
    expect(initialSql).toMatch(/enquiries_unassigned_idx.*\n?.*WHERE/);
  });
});

describe('append-only enforcement', () => {
  it('protects exactly the tables named in APPEND_ONLY_TABLES', () => {
    expect([...APPEND_ONLY_TABLES]).toEqual(['enquiry_status_events', 'audit_events']);

    for (const table of APPEND_ONLY_TABLES) {
      expect(triggerSql, table).toContain(`ON ${table}`);
    }
  });

  it('covers UPDATE, DELETE, and TRUNCATE', () => {
    // TRUNCATE is not a DELETE. A DELETE-only trigger would let
    // `TRUNCATE audit_events` erase the entire trail.
    for (const table of APPEND_ONLY_TABLES) {
      const trigger = triggerSql
        .split('--> statement-breakpoint')
        .find((block) => block.includes(`ON ${table}`));

      expect(trigger, table).toBeDefined();
      expect(trigger, table).toContain('BEFORE UPDATE OR DELETE OR TRUNCATE');
    }
  });

  it('fires per statement, not per row', () => {
    // A row-level trigger would let `DELETE FROM audit_events` on an empty table
    // report success.
    expect(triggerSql).toContain('FOR EACH STATEMENT EXECUTE FUNCTION cera_reject_mutation()');
    expect(triggerSql).not.toMatch(/FOR EACH ROW EXECUTE FUNCTION cera_reject_mutation/);
  });

  it('does not protect internal_notes, which is deliberately editable', () => {
    expect(APPEND_ONLY_TABLES as readonly string[]).not.toContain('internal_notes');
    // The audit of an edit is `edited_at`, which the table does carry.
    expect(initialSql).toContain('"edited_at" timestamp with time zone');
  });

  it('makes the enquiry reference immutable', () => {
    expect(triggerSql).toContain('BEFORE UPDATE OF reference ON enquiries');
  });

  it('maintains updated_at in the database on every table that has it', () => {
    const withUpdatedAt = ALL_TABLES.filter((table) => 'updatedAt' in getTableColumns(table)).map(
      getTableName,
    );

    expect(withUpdatedAt.sort()).toEqual([
      'customer_profiles',
      'enquiries',
      'integration_deliveries',
    ]);

    for (const table of withUpdatedAt) {
      expect(triggerSql, table).toContain(
        `ON ${table}\n  FOR EACH ROW EXECUTE FUNCTION cera_touch_updated_at()`,
      );
    }
  });
});

describe('the schema stays aligned with the contracts', () => {
  /**
   * Column-to-field parity, in the direction that matters.
   *
   * Include the private persistence metadata used for idempotency and optimistic
   * updates alongside the enquiry fields shared with the API.
   */
  it.each([
    [
      'enquiries',
      enquiries,
      [
        'id',
        'reference',
        'fingerprint',
        'idempotencyKey',
        'version',
        'customerSubjectId',
        'name',
        'email',
        'phone',
        'serviceId',
        'message',
        'consentAt',
        'source',
        'internalStatus',
        'ownerId',
        'createdAt',
        'updatedAt',
      ],
    ],
    [
      'enquiry_status_events',
      enquiryStatusEvents,
      [
        'id',
        'enquiryId',
        'previousStatus',
        'newStatus',
        'customerStatus',
        'actorSubjectId',
        'reason',
        'createdAt',
      ],
    ],
    [
      'internal_notes',
      internalNotes,
      ['id', 'enquiryId', 'authorSubjectId', 'body', 'createdAt', 'editedAt'],
    ],
    [
      'audit_events',
      auditEvents,
      [
        'id',
        'actorSubjectId',
        'action',
        'targetType',
        'targetId',
        'safeDiff',
        'requestId',
        'createdAt',
      ],
    ],
  ])('%s has exactly the fields the contract declares', (_name, table, expected) => {
    expect(Object.keys(getTableColumns(table)).sort()).toEqual([...expected].sort());
  });

  it('stores no clinical field, because PRD 3.2 puts clinical data out of scope', () => {
    // The same list the contract test asserts against, applied to the database so
    // a column cannot be added without a contract field to match it.
    const columns = Object.keys(getTableColumns(enquiries)).map((name) => name.toLowerCase());
    const prohibited = [
      'diagnosis',
      'medication',
      'allergies',
      'symptoms',
      'nhsnumber',
      'dateofbirth',
      'attachment',
    ];

    for (const field of prohibited) {
      expect(
        columns.some((column) => column.includes(field)),
        field,
      ).toBe(false);
    }
  });

  it('stores no raw token or plaintext claim email', () => {
    const columns = Object.keys(getTableColumns(enquiryClaimTokens));

    expect(columns).toContain('tokenHash');
    expect(columns).toContain('emailHash');
    expect(columns).not.toContain('token');
    expect(columns).not.toContain('email');
  });
});
