import { sql } from 'drizzle-orm';
import { check, index, jsonb, pgTable, varchar } from 'drizzle-orm/pg-core';

import { auditTargetTypeEnum, createdAt, primaryId, subjectId } from './shared.ts';

/**
 * The audit trail. Append-only, enforced by a trigger, not by convention.
 *
 * PRD 1.2 requires that every mutation is attributable. The trigger in
 * `0001_append_only.sql` is what makes that true even for a direct `psql` session,
 * a mistaken `ORM.update()`, or a future developer who has not read this comment.
 */
export const auditEvents = pgTable(
  'audit_events',
  {
    id: primaryId(),
    /** Null for system actions such as the automatic no-response closure. */
    actorSubjectId: subjectId('actor_subject_id'),
    /** Dotted action name, for example `enquiry.status.changed`. */
    action: varchar('action', { length: 80 }).notNull(),
    targetType: auditTargetTypeEnum('target_type').notNull(),
    /**
     * `varchar`, not `uuid`, because a target can be a Vendure service or a
     * Payload document whose ids are not UUIDs. Deliberately not a foreign key:
     * an audit row must outlive whatever it describes.
     */
    targetId: varchar('target_id', { length: 200 }).notNull(),
    /**
     * A field-level diff whose free-text values have already been reduced to
     * `{ changed: true }` by the redactor in `packages/observability`.
     *
     * This is why the audit table does not become a second copy of every enquiry
     * message and note body - a copy that would outlive the retention policy
     * applied to the originals and be readable by every staff member with audit
     * access. `jsonb` rather than `json` so the structure is queryable and stored
     * decomposed; the diff is read by operations, not only archived.
     */
    safeDiff: jsonb('safe_diff'),
    /** Ties the change to the request that made it, and so to the logs. */
    requestId: varchar('request_id', { length: 100 }).notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    /** "What happened to this record", which is how the staff UI reads it. */
    index('audit_events_target_idx').on(table.targetType, table.targetId, table.createdAt),
    /** "What did this person do", for an access review. */
    index('audit_events_actor_created_idx').on(table.actorSubjectId, table.createdAt.desc()),
    /** Correlates an audit row with a log line and a GlitchTip event. */
    index('audit_events_request_idx').on(table.requestId),
    check('audit_events_action_shape_check', sql`${table.action} ~ '^[a-z][a-z0-9_.]*$'`),
  ],
);
