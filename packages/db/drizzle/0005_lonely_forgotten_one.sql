ALTER TABLE "enquiries" ADD COLUMN "consent_version" varchar(64) DEFAULT 'legacy-unknown' NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "sequencing_data_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "samples_compounds_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "health_data_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "enquiries" ADD COLUMN "updates_opt_in" boolean DEFAULT false NOT NULL;