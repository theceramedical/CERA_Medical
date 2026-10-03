import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar NOT NULL,
  	"answer" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_enquiry_form_sequencing_consent" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"statement" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_enquiry_form_samples_consent" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"statement" varchar NOT NULL
  );
  
  CREATE TABLE "site_settings_enquiry_form_health_data_consent" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"statement" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings" ALTER COLUMN "tagline" SET DEFAULT 'Biomedical Research and Development';
  ALTER TABLE "site_settings" ALTER COLUMN "newsletter_heading" SET DEFAULT '';
  ALTER TABLE "site_settings" ALTER COLUMN "newsletter_body" SET DEFAULT '';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_consent_version" varchar DEFAULT 'cera-brief-2026-10-03-v1' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_general_consent" varchar DEFAULT 'I have read the Privacy Terms and I agree that CERA Medical may use the information I provide in this form to respond to my request and to deliver the service I have asked for.' NOT NULL;
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_updates_opt_in" varchar DEFAULT 'I would like to receive occasional updates from CERA Medical about its services and products. I can unsubscribe at any time.';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_contact_notice" varchar DEFAULT 'The details you enter here are used only to answer your enquiry.';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_success_message" varchar DEFAULT 'Thank you. Your request has been received and we will reply within three working days.';
  ALTER TABLE "site_settings_faqs" ADD CONSTRAINT "site_settings_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_enquiry_form_sequencing_consent" ADD CONSTRAINT "site_settings_enquiry_form_sequencing_consent_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_enquiry_form_samples_consent" ADD CONSTRAINT "site_settings_enquiry_form_samples_consent_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_enquiry_form_health_data_consent" ADD CONSTRAINT "site_settings_enquiry_form_health_data_consent_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_faqs_order_idx" ON "site_settings_faqs" USING btree ("_order");
  CREATE INDEX "site_settings_faqs_parent_id_idx" ON "site_settings_faqs" USING btree ("_parent_id");
  CREATE INDEX "site_settings_enquiry_form_sequencing_consent_order_idx" ON "site_settings_enquiry_form_sequencing_consent" USING btree ("_order");
  CREATE INDEX "site_settings_enquiry_form_sequencing_consent_parent_id_idx" ON "site_settings_enquiry_form_sequencing_consent" USING btree ("_parent_id");
  CREATE INDEX "site_settings_enquiry_form_samples_consent_order_idx" ON "site_settings_enquiry_form_samples_consent" USING btree ("_order");
  CREATE INDEX "site_settings_enquiry_form_samples_consent_parent_id_idx" ON "site_settings_enquiry_form_samples_consent" USING btree ("_parent_id");
  CREATE INDEX "site_settings_enquiry_form_health_data_consent_order_idx" ON "site_settings_enquiry_form_health_data_consent" USING btree ("_order");
  CREATE INDEX "site_settings_enquiry_form_health_data_consent_parent_id_idx" ON "site_settings_enquiry_form_health_data_consent" USING btree ("_parent_id");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings_faqs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_enquiry_form_sequencing_consent" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_enquiry_form_samples_consent" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings_enquiry_form_health_data_consent" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "site_settings_faqs" CASCADE;
  DROP TABLE "site_settings_enquiry_form_sequencing_consent" CASCADE;
  DROP TABLE "site_settings_enquiry_form_samples_consent" CASCADE;
  DROP TABLE "site_settings_enquiry_form_health_data_consent" CASCADE;
  ALTER TABLE "site_settings" ALTER COLUMN "tagline" SET DEFAULT 'Better Information. Healthier Lives.';
  ALTER TABLE "site_settings" ALTER COLUMN "newsletter_heading" SET DEFAULT 'Subscribe to Our Newsletter';
  ALTER TABLE "site_settings" ALTER COLUMN "newsletter_body" SET DEFAULT 'Get the latest health insights and updates.';
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_consent_version";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_general_consent";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_updates_opt_in";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_contact_notice";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_success_message";`);
}
