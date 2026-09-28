ALTER TABLE "enquiries" ADD COLUMN "fingerprint" varchar(64);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "idempotency_key" varchar(256);--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "enquiries_fingerprint_key" ON "enquiries" USING btree ("fingerprint");--> statement-breakpoint
CREATE UNIQUE INDEX "enquiries_idempotency_key" ON "enquiries" USING btree ("idempotency_key");