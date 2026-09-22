-- Append-only enforcement for the audit trail.
--
-- PRD 1.2 requires that every mutation is attributable, and section 8 requires an
-- audit history that can be relied on. Application discipline cannot deliver that:
-- a `db.update(auditEvents)` compiles, a `psql` session bypasses the application
-- entirely, and a well-intentioned "fix the actor on that one row" is indistinguishable
-- from tampering after the fact. A trigger makes the guarantee a property of the
-- database, so the only way to change history is to drop the trigger - which is itself
-- a schema change, reviewed and recorded in this folder.
--
-- Scope: `enquiry_status_events` and `audit_events` only. `internal_notes` is
-- deliberately mutable, because a typo in a note is worth correcting; `edited_at`
-- records that it happened. The list is mirrored in `APPEND_ONLY_TABLES` in
-- src/schema/index.ts, and a test asserts the two agree.

CREATE OR REPLACE FUNCTION cera_reject_mutation() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- ERRCODE 42501 is insufficient_privilege, which is the honest classification:
  -- no role may do this. It also means a client library surfaces it as a
  -- permissions error rather than a constraint violation a retry might clear.
  RAISE EXCEPTION
    '% is append-only: % is not permitted', TG_TABLE_NAME, TG_OP
    USING ERRCODE = '42501',
          HINT = 'Insert a new row that supersedes the old one. History is never rewritten.';
END;
$$;
--> statement-breakpoint

-- Statement-level, not row-level, and FOR EACH STATEMENT is the important part:
-- a row-level trigger fires once per affected row, so `DELETE FROM audit_events`
-- on an empty table would succeed silently and report success. A statement-level
-- trigger rejects the statement whether or not it would have matched anything.
CREATE TRIGGER enquiry_status_events_append_only
  BEFORE UPDATE OR DELETE OR TRUNCATE ON enquiry_status_events
  FOR EACH STATEMENT EXECUTE FUNCTION cera_reject_mutation();
--> statement-breakpoint

CREATE TRIGGER audit_events_append_only
  BEFORE UPDATE OR DELETE OR TRUNCATE ON audit_events
  FOR EACH STATEMENT EXECUTE FUNCTION cera_reject_mutation();
--> statement-breakpoint

-- TRUNCATE is covered above and matters more than it first appears: it is not a
-- DELETE, so a DELETE-only trigger would let `TRUNCATE audit_events` erase the
-- entire trail. `pnpm seed:reset` therefore cannot truncate these two tables and
-- drops the triggers explicitly for the duration of a reset, which is why that
-- script refuses to run outside development.

-- Enquiry references are immutable once issued. Customers quote them to staff and
-- they appear in Zoho, so a reference that changes makes two records impossible to
-- reconcile. This is a column-level rule rather than a table-level one, so it is a
-- row trigger on the one column.
CREATE OR REPLACE FUNCTION cera_reject_reference_change() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.reference IS DISTINCT FROM OLD.reference THEN
    RAISE EXCEPTION 'enquiries.reference is immutable once issued'
      USING ERRCODE = '42501',
            HINT = 'The reference is quoted by customers and stored in Zoho. It cannot be reassigned.';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER enquiries_reference_immutable
  BEFORE UPDATE OF reference ON enquiries
  FOR EACH ROW EXECUTE FUNCTION cera_reject_reference_change();
--> statement-breakpoint

-- `updated_at` maintained by the database rather than by every caller.
--
-- Not a convenience. Staff pages and the customer dashboard both order by it, and
-- a caller that forgets to set it produces an enquiry that was worked on and does
-- not appear to have moved - which in a queue means it is silently deprioritised.
CREATE OR REPLACE FUNCTION cera_touch_updated_at() RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
--> statement-breakpoint

CREATE TRIGGER enquiries_touch_updated_at
  BEFORE UPDATE ON enquiries
  FOR EACH ROW EXECUTE FUNCTION cera_touch_updated_at();
--> statement-breakpoint

CREATE TRIGGER customer_profiles_touch_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION cera_touch_updated_at();
--> statement-breakpoint

CREATE TRIGGER integration_deliveries_touch_updated_at
  BEFORE UPDATE ON integration_deliveries
  FOR EACH ROW EXECUTE FUNCTION cera_touch_updated_at();
