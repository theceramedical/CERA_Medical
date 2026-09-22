CREATE TYPE "public"."audit_target_type" AS ENUM('enquiry', 'content', 'customer', 'service', 'user', 'release');--> statement-breakpoint
CREATE TYPE "public"."customer_status" AS ENUM('received', 'in_review', 'action_needed', 'in_progress', 'completed', 'closed');--> statement-breakpoint
CREATE TYPE "public"."delivery_status" AS ENUM('pending', 'in_flight', 'succeeded', 'failed', 'dead_letter');--> statement-breakpoint
CREATE TYPE "public"."enquiry_source" AS ENUM('web_service_page', 'web_contact_page', 'web_general');--> statement-breakpoint
CREATE TYPE "public"."integration_event_type" AS ENUM('zoho.lead.upsert', 'resend.customer.receipt', 'resend.staff.alert', 'resend.status.update');--> statement-breakpoint
CREATE TYPE "public"."integration_provider" AS ENUM('zoho', 'resend');--> statement-breakpoint
CREATE TYPE "public"."internal_status" AS ENUM('received', 'triaging', 'awaiting_customer', 'in_progress', 'referred', 'completed', 'closed_no_response', 'closed_withdrawn', 'rejected_spam');--> statement-breakpoint
CREATE TYPE "public"."outbox_status" AS ENUM('pending', 'in_flight', 'done', 'dead_letter');--> statement-breakpoint
CREATE TABLE "audit_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"actor_subject_id" varchar(255),
	"action" varchar(80) NOT NULL,
	"target_type" "audit_target_type" NOT NULL,
	"target_id" varchar(200) NOT NULL,
	"safe_diff" jsonb,
	"request_id" varchar(100) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_events_action_shape_check" CHECK ("audit_events"."action" ~ '^[a-z][a-z0-9_.]*$')
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"subject_id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"display_name" varchar(120) NOT NULL,
	"phone" varchar(32),
	"email_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_profiles_email_shape_check" CHECK (position('@' in "customer_profiles"."email") > 1)
);
--> statement-breakpoint
CREATE TABLE "email_suppressions" (
	"email" varchar(320) PRIMARY KEY NOT NULL,
	"reason" varchar(40) NOT NULL,
	"suppressed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_suppressions_reason_check" CHECK ("email_suppressions"."reason" in ('bounced', 'complained', 'manual')),
	CONSTRAINT "email_suppressions_email_lowercase_check" CHECK ("email_suppressions"."email" = lower("email_suppressions"."email"))
);
--> statement-breakpoint
CREATE TABLE "enquiries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"reference" varchar(18) NOT NULL,
	"customer_subject_id" varchar(255),
	"name" varchar(120) NOT NULL,
	"email" varchar(320) NOT NULL,
	"phone" varchar(32),
	"service_id" varchar(64) NOT NULL,
	"message" text NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"source" "enquiry_source" NOT NULL,
	"internal_status" "internal_status" DEFAULT 'received' NOT NULL,
	"owner_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enquiries_message_length_check" CHECK (char_length("enquiries"."message") between 10 and 2000),
	CONSTRAINT "enquiries_name_length_check" CHECK (char_length("enquiries"."name") >= 2),
	CONSTRAINT "enquiries_consent_not_future_check" CHECK ("enquiries"."consent_at" <= "enquiries"."created_at" + interval '1 second')
);
--> statement-breakpoint
CREATE TABLE "enquiry_claim_tokens" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"email_hash" char(64) NOT NULL,
	"token_hash" char(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"consumed_by_subject_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enquiry_claim_tokens_expires_after_created_check" CHECK ("enquiry_claim_tokens"."expires_at" > "enquiry_claim_tokens"."created_at"),
	CONSTRAINT "enquiry_claim_tokens_consumption_consistency_check" CHECK (("enquiry_claim_tokens"."consumed_at" is null) = ("enquiry_claim_tokens"."consumed_by_subject_id" is null))
);
--> statement-breakpoint
CREATE TABLE "enquiry_status_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"previous_status" "internal_status",
	"new_status" "internal_status" NOT NULL,
	"customer_status" "customer_status" NOT NULL,
	"actor_subject_id" varchar(255),
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enquiry_status_events_no_self_transition_check" CHECK ("enquiry_status_events"."previous_status" is null or "enquiry_status_events"."previous_status" <> "enquiry_status_events"."new_status"),
	CONSTRAINT "enquiry_status_events_reason_length_check" CHECK ("enquiry_status_events"."reason" is null or char_length("enquiry_status_events"."reason") <= 500)
);
--> statement-breakpoint
CREATE TABLE "integration_deliveries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"provider" "integration_provider" NOT NULL,
	"event_type" "integration_event_type" NOT NULL,
	"idempotency_key" varchar(256) NOT NULL,
	"external_id" varchar(200),
	"attempt" smallint DEFAULT 0 NOT NULL,
	"status" "delivery_status" DEFAULT 'pending' NOT NULL,
	"response_code" integer,
	"error_class" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "integration_deliveries_response_code_check" CHECK ("integration_deliveries"."response_code" is null or "integration_deliveries"."response_code" between 100 and 599),
	CONSTRAINT "integration_deliveries_attempt_bounded_check" CHECK ("integration_deliveries"."attempt" between 0 and 100),
	CONSTRAINT "integration_deliveries_success_has_external_id_check" CHECK ("integration_deliveries"."status" <> 'succeeded' or "integration_deliveries"."external_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "internal_notes" (
	"id" uuid PRIMARY KEY NOT NULL,
	"enquiry_id" uuid NOT NULL,
	"author_subject_id" varchar(255) NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"edited_at" timestamp with time zone,
	CONSTRAINT "internal_notes_body_length_check" CHECK (char_length("internal_notes"."body") between 1 and 4000),
	CONSTRAINT "internal_notes_edited_after_created_check" CHECK ("internal_notes"."edited_at" is null or "internal_notes"."edited_at" >= "internal_notes"."created_at")
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY NOT NULL,
	"aggregate_type" varchar(40) DEFAULT 'enquiry' NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"event_type" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"locked_at" timestamp with time zone,
	"locked_by" varchar(120),
	"status" "outbox_status" DEFAULT 'pending' NOT NULL,
	"last_error" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_lock_consistency_check" CHECK (("outbox"."locked_at" is null) = ("outbox"."locked_by" is null)),
	CONSTRAINT "outbox_attempts_bounded_check" CHECK ("outbox"."attempts" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "enquiry_claim_tokens" ADD CONSTRAINT "enquiry_claim_tokens_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry_status_events" ADD CONSTRAINT "enquiry_status_events_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_deliveries" ADD CONSTRAINT "integration_deliveries_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_enquiry_id_enquiries_id_fk" FOREIGN KEY ("enquiry_id") REFERENCES "public"."enquiries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_events_target_idx" ON "audit_events" USING btree ("target_type","target_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_events_actor_created_idx" ON "audit_events" USING btree ("actor_subject_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_events_request_idx" ON "audit_events" USING btree ("request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_profiles_email_key" ON "customer_profiles" USING btree (lower("email"));--> statement-breakpoint
CREATE INDEX "customer_profiles_verified_idx" ON "customer_profiles" USING btree ("email_verified_at") WHERE "customer_profiles"."email_verified_at" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "enquiries_reference_key" ON "enquiries" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "enquiries_status_created_idx" ON "enquiries" USING btree ("internal_status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "enquiries_customer_created_idx" ON "enquiries" USING btree ("customer_subject_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "enquiries_unassigned_idx" ON "enquiries" USING btree ("created_at" DESC NULLS LAST) WHERE "enquiries"."owner_id" is null;--> statement-breakpoint
CREATE INDEX "enquiries_owner_created_idx" ON "enquiries" USING btree ("owner_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "enquiries_service_idx" ON "enquiries" USING btree ("service_id");--> statement-breakpoint
CREATE UNIQUE INDEX "enquiry_claim_tokens_token_hash_key" ON "enquiry_claim_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "enquiry_claim_tokens_enquiry_idx" ON "enquiry_claim_tokens" USING btree ("enquiry_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "enquiry_claim_tokens_expiry_idx" ON "enquiry_claim_tokens" USING btree ("expires_at") WHERE "enquiry_claim_tokens"."consumed_at" is null;--> statement-breakpoint
CREATE INDEX "enquiry_status_events_enquiry_created_idx" ON "enquiry_status_events" USING btree ("enquiry_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "integration_deliveries_idempotency_key" ON "integration_deliveries" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "integration_deliveries_enquiry_idx" ON "integration_deliveries" USING btree ("enquiry_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "integration_deliveries_dead_letter_idx" ON "integration_deliveries" USING btree ("created_at" DESC NULLS LAST) WHERE "integration_deliveries"."status" = 'dead_letter';--> statement-breakpoint
CREATE INDEX "integration_deliveries_provider_status_idx" ON "integration_deliveries" USING btree ("provider","status");--> statement-breakpoint
CREATE INDEX "internal_notes_enquiry_created_idx" ON "internal_notes" USING btree ("enquiry_id","created_at");--> statement-breakpoint
CREATE INDEX "outbox_pending_available_idx" ON "outbox" USING btree ("available_at") WHERE "outbox"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "outbox_locked_idx" ON "outbox" USING btree ("locked_at") WHERE "outbox"."locked_at" is not null;--> statement-breakpoint
CREATE INDEX "outbox_aggregate_idx" ON "outbox" USING btree ("aggregate_type","aggregate_id");