import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_feat_grid_tone" AS ENUM('surface', 'surface-tint', 'surface-tint-2');
  CREATE TYPE "public"."enum_proc_steps_tone" AS ENUM('surface', 'surface-tint', 'surface-tint-2');
  CREATE TYPE "public"."enum_proc_steps_variant" AS ENUM('grid', 'timeline', 'numbered');
  CREATE TYPE "public"."enum__feat_grid_v_tone" AS ENUM('surface', 'surface-tint', 'surface-tint-2');
  CREATE TYPE "public"."enum__proc_steps_v_tone" AS ENUM('surface', 'surface-tint', 'surface-tint-2');
  CREATE TYPE "public"."enum__proc_steps_v_variant" AS ENUM('grid', 'timeline', 'numbered');
  CREATE TYPE "public"."enum_service_presentations_card_icon" AS ENUM('microscope', 'dna', 'database', 'chart', 'fileText');
  CREATE TYPE "public"."enum__service_presentations_v_version_card_icon" AS ENUM('microscope', 'dna', 'database', 'chart', 'fileText');
  CREATE TYPE "public"."enum_site_settings_contact_locations_icon" AS ENUM('mail', 'mapPin', 'phone');
  CREATE TABLE "pages_blocks_hero_trust_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_section_heading_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "pages_blocks_section_heading" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_services_catalogue" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"search_label" varchar DEFAULT 'Search services',
  	"apply_label" varchar DEFAULT 'Apply',
  	"empty_heading" varchar DEFAULT 'No services match those filters',
  	"empty_description" varchar DEFAULT 'Clear the search or browse the full list of research services.',
  	"degraded_alert" varchar DEFAULT 'Live catalogue data is temporarily unavailable. Showing the last known services.',
  	"block_name" varchar
  );
  
  CREATE TABLE "hl" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "feat" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"href" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "feat_grid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"tone" "enum_feat_grid_tone" DEFAULT 'surface',
  	"centered" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "proc_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "proc_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"tone" "enum_proc_steps_tone" DEFAULT 'surface',
  	"variant" "enum_proc_steps_variant" DEFAULT 'grid',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_statistics_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "pages_blocks_statistics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_services_showcase" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"view_all_href" varchar DEFAULT '/services',
  	"view_all_label" varchar DEFAULT 'View All Services',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_articles_preview" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"view_all_href" varchar DEFAULT '/articles',
  	"view_all_label" varchar DEFAULT 'View All Articles',
  	"max_posts" numeric DEFAULT 3,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "pages_blocks_faq_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"link_href" varchar DEFAULT '/faqs',
  	"link_label" varchar DEFAULT 'All FAQs',
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_callout_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "svc_hero_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "svc_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"notice_title" varchar,
  	"notice_body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "kv_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "kv_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "enq_aside" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Project inquiry',
  	"title" varchar DEFAULT 'Start a project conversation',
  	"body" varchar,
  	"button_label" varchar DEFAULT 'Request this service',
  	"block_name" varchar
  );
  
  CREATE TABLE "side_card_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "side_card_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "side_card" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_hero_trust_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_section_heading_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_section_heading" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_services_catalogue" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"search_label" varchar DEFAULT 'Search services',
  	"apply_label" varchar DEFAULT 'Apply',
  	"empty_heading" varchar DEFAULT 'No services match those filters',
  	"empty_description" varchar DEFAULT 'Clear the search or browse the full list of research services.',
  	"degraded_alert" varchar DEFAULT 'Live catalogue data is temporarily unavailable. Showing the last known services.',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_hl_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_feat_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"href" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_feat_grid_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"tone" "enum__feat_grid_v_tone" DEFAULT 'surface',
  	"centered" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_proc_steps_v_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_proc_steps_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"tone" "enum__proc_steps_v_tone" DEFAULT 'surface',
  	"variant" "enum__proc_steps_v_variant" DEFAULT 'grid',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_statistics_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"label" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_statistics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_services_showcase" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"view_all_href" varchar DEFAULT '/services',
  	"view_all_label" varchar DEFAULT 'View All Services',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_articles_preview" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"view_all_href" varchar DEFAULT '/articles',
  	"view_all_label" varchar DEFAULT 'View All Articles',
  	"max_posts" numeric DEFAULT 3,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_faq_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"link_href" varchar DEFAULT '/faqs',
  	"link_label" varchar DEFAULT 'All FAQs',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_callout_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_svc_hero_v_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_svc_hero_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"notice_title" varchar,
  	"notice_body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_kv_list_v_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_kv_list_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_trust_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_enq_aside_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar DEFAULT 'Project inquiry',
  	"title" varchar DEFAULT 'Start a project conversation',
  	"body" varchar,
  	"button_label" varchar DEFAULT 'Request this service',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_side_card_v_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_side_card_v_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_side_card_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "service_presentations_card_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "service_presentations_blocks_section_heading_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "service_presentations_blocks_section_heading" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "service_presentations_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "service_presentations_blocks_callout_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "service_presentations_blocks_faq_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar
  );
  
  CREATE TABLE "service_presentations_blocks_faq_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"link_href" varchar DEFAULT '/faqs',
  	"link_label" varchar DEFAULT 'All FAQs',
  	"block_name" varchar
  );
  
  CREATE TABLE "_service_presentations_v_version_card_highlights" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_service_presentations_v_blocks_section_heading_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_service_presentations_v_blocks_section_heading" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_service_presentations_v_blocks_rich_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_service_presentations_v_blocks_callout_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_service_presentations_v_blocks_faq_list_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"question" varchar,
  	"answer" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_service_presentations_v_blocks_faq_list" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"link_href" varchar DEFAULT '/faqs',
  	"link_label" varchar DEFAULT 'All FAQs',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "site_settings_contact_locations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL,
  	"href" varchar,
  	"icon" "enum_site_settings_contact_locations_icon" DEFAULT 'mapPin'
  );
  
  CREATE TABLE "site_settings_enquiry_form_extra_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL
  );
  
  ALTER TABLE "service_presentations" ADD COLUMN "card_icon" "enum_service_presentations_card_icon";
  ALTER TABLE "_service_presentations_v" ADD COLUMN "version_card_icon" "enum__service_presentations_v_version_card_icon";
  ALTER TABLE "site_settings" ADD COLUMN "contact_enquiry_heading" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "contact_enquiry_body" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "contact_enquiry_button_label" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "contact_enquiry_button_href" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "contact_enquiry_form_section_title" varchar DEFAULT 'Service request form';
  ALTER TABLE "site_settings" ADD COLUMN "contact_enquiry_show_inline_form" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_field_labels_name" varchar DEFAULT 'Name';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_field_labels_email" varchar DEFAULT 'Email address';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_field_labels_phone" varchar DEFAULT 'Phone';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_field_labels_institution" varchar DEFAULT 'Institution';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_field_labels_country" varchar DEFAULT 'Country';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_field_labels_service_id" varchar DEFAULT 'Service required';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_field_labels_message" varchar DEFAULT 'Project description';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_field_labels_submit" varchar DEFAULT 'Submit enquiry';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_field_hints_email" varchar DEFAULT 'We use this address to reply to your request.';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_field_hints_service_locked" varchar DEFAULT 'This enquiry is for the service you were reading about.';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_field_hints_message" varchar DEFAULT 'Describe your samples, compounds or data, timeline and what you need. Do not include patient names or other identifying details.';
  ALTER TABLE "site_settings" ADD COLUMN "enquiry_form_retention_footer" varchar DEFAULT 'See the Data Retention Policy for how long they are kept.';
  ALTER TABLE "announcement" ADD COLUMN "status_label" varchar;
  ALTER TABLE "announcement" ADD COLUMN "link_label" varchar;
  ALTER TABLE "pages_blocks_hero_trust_items" ADD CONSTRAINT "pages_blocks_hero_trust_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_section_heading_badges" ADD CONSTRAINT "pages_blocks_section_heading_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_section_heading"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_section_heading" ADD CONSTRAINT "pages_blocks_section_heading_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_services_catalogue" ADD CONSTRAINT "pages_blocks_services_catalogue_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hl" ADD CONSTRAINT "hl_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."feat"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "feat" ADD CONSTRAINT "feat_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."feat_grid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "feat_grid" ADD CONSTRAINT "feat_grid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "proc_steps_steps" ADD CONSTRAINT "proc_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."proc_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "proc_steps" ADD CONSTRAINT "proc_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_statistics_items" ADD CONSTRAINT "pages_blocks_statistics_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_statistics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_statistics" ADD CONSTRAINT "pages_blocks_statistics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_services_showcase" ADD CONSTRAINT "pages_blocks_services_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_articles_preview" ADD CONSTRAINT "pages_blocks_articles_preview_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_list_items" ADD CONSTRAINT "pages_blocks_faq_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_faq_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_faq_list" ADD CONSTRAINT "pages_blocks_faq_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_callout_band" ADD CONSTRAINT "pages_blocks_callout_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "svc_hero_badges" ADD CONSTRAINT "svc_hero_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."svc_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "svc_hero" ADD CONSTRAINT "svc_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "kv_list_items" ADD CONSTRAINT "kv_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."kv_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "kv_list" ADD CONSTRAINT "kv_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "trust" ADD CONSTRAINT "trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."enq_aside"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "enq_aside" ADD CONSTRAINT "enq_aside_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "side_card_items" ADD CONSTRAINT "side_card_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."side_card"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "side_card_bullets" ADD CONSTRAINT "side_card_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."side_card"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "side_card" ADD CONSTRAINT "side_card_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_hero_trust_items" ADD CONSTRAINT "_pages_v_blocks_hero_trust_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_section_heading_badges" ADD CONSTRAINT "_pages_v_blocks_section_heading_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_section_heading"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_section_heading" ADD CONSTRAINT "_pages_v_blocks_section_heading_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_services_catalogue" ADD CONSTRAINT "_pages_v_blocks_services_catalogue_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_hl_v" ADD CONSTRAINT "_hl_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_feat_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_feat_v" ADD CONSTRAINT "_feat_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_feat_grid_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_feat_grid_v" ADD CONSTRAINT "_feat_grid_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_proc_steps_v_steps" ADD CONSTRAINT "_proc_steps_v_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_proc_steps_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_proc_steps_v" ADD CONSTRAINT "_proc_steps_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_statistics_items" ADD CONSTRAINT "_pages_v_blocks_statistics_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_statistics"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_statistics" ADD CONSTRAINT "_pages_v_blocks_statistics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_services_showcase" ADD CONSTRAINT "_pages_v_blocks_services_showcase_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_articles_preview" ADD CONSTRAINT "_pages_v_blocks_articles_preview_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_list_items" ADD CONSTRAINT "_pages_v_blocks_faq_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_faq_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_faq_list" ADD CONSTRAINT "_pages_v_blocks_faq_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_callout_band" ADD CONSTRAINT "_pages_v_blocks_callout_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_svc_hero_v_badges" ADD CONSTRAINT "_svc_hero_v_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_svc_hero_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_svc_hero_v" ADD CONSTRAINT "_svc_hero_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_kv_list_v_items" ADD CONSTRAINT "_kv_list_v_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_kv_list_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_kv_list_v" ADD CONSTRAINT "_kv_list_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_trust_v" ADD CONSTRAINT "_trust_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_enq_aside_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_enq_aside_v" ADD CONSTRAINT "_enq_aside_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_side_card_v_items" ADD CONSTRAINT "_side_card_v_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_side_card_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_side_card_v_bullets" ADD CONSTRAINT "_side_card_v_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_side_card_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_side_card_v" ADD CONSTRAINT "_side_card_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_presentations_card_highlights" ADD CONSTRAINT "service_presentations_card_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_presentations_blocks_section_heading_badges" ADD CONSTRAINT "service_presentations_blocks_section_heading_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations_blocks_section_heading"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_presentations_blocks_section_heading" ADD CONSTRAINT "service_presentations_blocks_section_heading_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_presentations_blocks_rich_text" ADD CONSTRAINT "service_presentations_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_presentations_blocks_callout_band" ADD CONSTRAINT "service_presentations_blocks_callout_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_presentations_blocks_faq_list_items" ADD CONSTRAINT "service_presentations_blocks_faq_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations_blocks_faq_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_presentations_blocks_faq_list" ADD CONSTRAINT "service_presentations_blocks_faq_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_service_presentations_v_version_card_highlights" ADD CONSTRAINT "_service_presentations_v_version_card_highlights_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_service_presentations_v_blocks_section_heading_badges" ADD CONSTRAINT "_service_presentations_v_blocks_section_heading_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v_blocks_section_heading"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_service_presentations_v_blocks_section_heading" ADD CONSTRAINT "_service_presentations_v_blocks_section_heading_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_service_presentations_v_blocks_rich_text" ADD CONSTRAINT "_service_presentations_v_blocks_rich_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_service_presentations_v_blocks_callout_band" ADD CONSTRAINT "_service_presentations_v_blocks_callout_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_service_presentations_v_blocks_faq_list_items" ADD CONSTRAINT "_service_presentations_v_blocks_faq_list_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v_blocks_faq_list"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_service_presentations_v_blocks_faq_list" ADD CONSTRAINT "_service_presentations_v_blocks_faq_list_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_contact_locations" ADD CONSTRAINT "site_settings_contact_locations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_enquiry_form_extra_services" ADD CONSTRAINT "site_settings_enquiry_form_extra_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_hero_trust_items_order_idx" ON "pages_blocks_hero_trust_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_hero_trust_items_parent_id_idx" ON "pages_blocks_hero_trust_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_section_heading_badges_order_idx" ON "pages_blocks_section_heading_badges" USING btree ("_order");
  CREATE INDEX "pages_blocks_section_heading_badges_parent_id_idx" ON "pages_blocks_section_heading_badges" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_section_heading_order_idx" ON "pages_blocks_section_heading" USING btree ("_order");
  CREATE INDEX "pages_blocks_section_heading_parent_id_idx" ON "pages_blocks_section_heading" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_section_heading_path_idx" ON "pages_blocks_section_heading" USING btree ("_path");
  CREATE INDEX "pages_blocks_services_catalogue_order_idx" ON "pages_blocks_services_catalogue" USING btree ("_order");
  CREATE INDEX "pages_blocks_services_catalogue_parent_id_idx" ON "pages_blocks_services_catalogue" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_catalogue_path_idx" ON "pages_blocks_services_catalogue" USING btree ("_path");
  CREATE INDEX "hl_order_idx" ON "hl" USING btree ("_order");
  CREATE INDEX "hl_parent_id_idx" ON "hl" USING btree ("_parent_id");
  CREATE INDEX "feat_order_idx" ON "feat" USING btree ("_order");
  CREATE INDEX "feat_parent_id_idx" ON "feat" USING btree ("_parent_id");
  CREATE INDEX "feat_grid_order_idx" ON "feat_grid" USING btree ("_order");
  CREATE INDEX "feat_grid_parent_id_idx" ON "feat_grid" USING btree ("_parent_id");
  CREATE INDEX "feat_grid_path_idx" ON "feat_grid" USING btree ("_path");
  CREATE INDEX "proc_steps_steps_order_idx" ON "proc_steps_steps" USING btree ("_order");
  CREATE INDEX "proc_steps_steps_parent_id_idx" ON "proc_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "proc_steps_order_idx" ON "proc_steps" USING btree ("_order");
  CREATE INDEX "proc_steps_parent_id_idx" ON "proc_steps" USING btree ("_parent_id");
  CREATE INDEX "proc_steps_path_idx" ON "proc_steps" USING btree ("_path");
  CREATE INDEX "pages_blocks_statistics_items_order_idx" ON "pages_blocks_statistics_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_statistics_items_parent_id_idx" ON "pages_blocks_statistics_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_statistics_order_idx" ON "pages_blocks_statistics" USING btree ("_order");
  CREATE INDEX "pages_blocks_statistics_parent_id_idx" ON "pages_blocks_statistics" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_statistics_path_idx" ON "pages_blocks_statistics" USING btree ("_path");
  CREATE INDEX "pages_blocks_services_showcase_order_idx" ON "pages_blocks_services_showcase" USING btree ("_order");
  CREATE INDEX "pages_blocks_services_showcase_parent_id_idx" ON "pages_blocks_services_showcase" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_services_showcase_path_idx" ON "pages_blocks_services_showcase" USING btree ("_path");
  CREATE INDEX "pages_blocks_articles_preview_order_idx" ON "pages_blocks_articles_preview" USING btree ("_order");
  CREATE INDEX "pages_blocks_articles_preview_parent_id_idx" ON "pages_blocks_articles_preview" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_articles_preview_path_idx" ON "pages_blocks_articles_preview" USING btree ("_path");
  CREATE INDEX "pages_blocks_faq_list_items_order_idx" ON "pages_blocks_faq_list_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_list_items_parent_id_idx" ON "pages_blocks_faq_list_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_list_order_idx" ON "pages_blocks_faq_list" USING btree ("_order");
  CREATE INDEX "pages_blocks_faq_list_parent_id_idx" ON "pages_blocks_faq_list" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_faq_list_path_idx" ON "pages_blocks_faq_list" USING btree ("_path");
  CREATE INDEX "pages_blocks_callout_band_order_idx" ON "pages_blocks_callout_band" USING btree ("_order");
  CREATE INDEX "pages_blocks_callout_band_parent_id_idx" ON "pages_blocks_callout_band" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_callout_band_path_idx" ON "pages_blocks_callout_band" USING btree ("_path");
  CREATE INDEX "svc_hero_badges_order_idx" ON "svc_hero_badges" USING btree ("_order");
  CREATE INDEX "svc_hero_badges_parent_id_idx" ON "svc_hero_badges" USING btree ("_parent_id");
  CREATE INDEX "svc_hero_order_idx" ON "svc_hero" USING btree ("_order");
  CREATE INDEX "svc_hero_parent_id_idx" ON "svc_hero" USING btree ("_parent_id");
  CREATE INDEX "svc_hero_path_idx" ON "svc_hero" USING btree ("_path");
  CREATE INDEX "kv_list_items_order_idx" ON "kv_list_items" USING btree ("_order");
  CREATE INDEX "kv_list_items_parent_id_idx" ON "kv_list_items" USING btree ("_parent_id");
  CREATE INDEX "kv_list_order_idx" ON "kv_list" USING btree ("_order");
  CREATE INDEX "kv_list_parent_id_idx" ON "kv_list" USING btree ("_parent_id");
  CREATE INDEX "kv_list_path_idx" ON "kv_list" USING btree ("_path");
  CREATE INDEX "trust_order_idx" ON "trust" USING btree ("_order");
  CREATE INDEX "trust_parent_id_idx" ON "trust" USING btree ("_parent_id");
  CREATE INDEX "enq_aside_order_idx" ON "enq_aside" USING btree ("_order");
  CREATE INDEX "enq_aside_parent_id_idx" ON "enq_aside" USING btree ("_parent_id");
  CREATE INDEX "enq_aside_path_idx" ON "enq_aside" USING btree ("_path");
  CREATE INDEX "side_card_items_order_idx" ON "side_card_items" USING btree ("_order");
  CREATE INDEX "side_card_items_parent_id_idx" ON "side_card_items" USING btree ("_parent_id");
  CREATE INDEX "side_card_bullets_order_idx" ON "side_card_bullets" USING btree ("_order");
  CREATE INDEX "side_card_bullets_parent_id_idx" ON "side_card_bullets" USING btree ("_parent_id");
  CREATE INDEX "side_card_order_idx" ON "side_card" USING btree ("_order");
  CREATE INDEX "side_card_parent_id_idx" ON "side_card" USING btree ("_parent_id");
  CREATE INDEX "side_card_path_idx" ON "side_card" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_hero_trust_items_order_idx" ON "_pages_v_blocks_hero_trust_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_hero_trust_items_parent_id_idx" ON "_pages_v_blocks_hero_trust_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_section_heading_badges_order_idx" ON "_pages_v_blocks_section_heading_badges" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_section_heading_badges_parent_id_idx" ON "_pages_v_blocks_section_heading_badges" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_section_heading_order_idx" ON "_pages_v_blocks_section_heading" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_section_heading_parent_id_idx" ON "_pages_v_blocks_section_heading" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_section_heading_path_idx" ON "_pages_v_blocks_section_heading" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_services_catalogue_order_idx" ON "_pages_v_blocks_services_catalogue" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_services_catalogue_parent_id_idx" ON "_pages_v_blocks_services_catalogue" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_services_catalogue_path_idx" ON "_pages_v_blocks_services_catalogue" USING btree ("_path");
  CREATE INDEX "_hl_v_order_idx" ON "_hl_v" USING btree ("_order");
  CREATE INDEX "_hl_v_parent_id_idx" ON "_hl_v" USING btree ("_parent_id");
  CREATE INDEX "_feat_v_order_idx" ON "_feat_v" USING btree ("_order");
  CREATE INDEX "_feat_v_parent_id_idx" ON "_feat_v" USING btree ("_parent_id");
  CREATE INDEX "_feat_grid_v_order_idx" ON "_feat_grid_v" USING btree ("_order");
  CREATE INDEX "_feat_grid_v_parent_id_idx" ON "_feat_grid_v" USING btree ("_parent_id");
  CREATE INDEX "_feat_grid_v_path_idx" ON "_feat_grid_v" USING btree ("_path");
  CREATE INDEX "_proc_steps_v_steps_order_idx" ON "_proc_steps_v_steps" USING btree ("_order");
  CREATE INDEX "_proc_steps_v_steps_parent_id_idx" ON "_proc_steps_v_steps" USING btree ("_parent_id");
  CREATE INDEX "_proc_steps_v_order_idx" ON "_proc_steps_v" USING btree ("_order");
  CREATE INDEX "_proc_steps_v_parent_id_idx" ON "_proc_steps_v" USING btree ("_parent_id");
  CREATE INDEX "_proc_steps_v_path_idx" ON "_proc_steps_v" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_statistics_items_order_idx" ON "_pages_v_blocks_statistics_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_statistics_items_parent_id_idx" ON "_pages_v_blocks_statistics_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_statistics_order_idx" ON "_pages_v_blocks_statistics" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_statistics_parent_id_idx" ON "_pages_v_blocks_statistics" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_statistics_path_idx" ON "_pages_v_blocks_statistics" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_services_showcase_order_idx" ON "_pages_v_blocks_services_showcase" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_services_showcase_parent_id_idx" ON "_pages_v_blocks_services_showcase" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_services_showcase_path_idx" ON "_pages_v_blocks_services_showcase" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_articles_preview_order_idx" ON "_pages_v_blocks_articles_preview" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_articles_preview_parent_id_idx" ON "_pages_v_blocks_articles_preview" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_articles_preview_path_idx" ON "_pages_v_blocks_articles_preview" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_faq_list_items_order_idx" ON "_pages_v_blocks_faq_list_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_list_items_parent_id_idx" ON "_pages_v_blocks_faq_list_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_list_order_idx" ON "_pages_v_blocks_faq_list" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_faq_list_parent_id_idx" ON "_pages_v_blocks_faq_list" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_faq_list_path_idx" ON "_pages_v_blocks_faq_list" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_callout_band_order_idx" ON "_pages_v_blocks_callout_band" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_callout_band_parent_id_idx" ON "_pages_v_blocks_callout_band" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_callout_band_path_idx" ON "_pages_v_blocks_callout_band" USING btree ("_path");
  CREATE INDEX "_svc_hero_v_badges_order_idx" ON "_svc_hero_v_badges" USING btree ("_order");
  CREATE INDEX "_svc_hero_v_badges_parent_id_idx" ON "_svc_hero_v_badges" USING btree ("_parent_id");
  CREATE INDEX "_svc_hero_v_order_idx" ON "_svc_hero_v" USING btree ("_order");
  CREATE INDEX "_svc_hero_v_parent_id_idx" ON "_svc_hero_v" USING btree ("_parent_id");
  CREATE INDEX "_svc_hero_v_path_idx" ON "_svc_hero_v" USING btree ("_path");
  CREATE INDEX "_kv_list_v_items_order_idx" ON "_kv_list_v_items" USING btree ("_order");
  CREATE INDEX "_kv_list_v_items_parent_id_idx" ON "_kv_list_v_items" USING btree ("_parent_id");
  CREATE INDEX "_kv_list_v_order_idx" ON "_kv_list_v" USING btree ("_order");
  CREATE INDEX "_kv_list_v_parent_id_idx" ON "_kv_list_v" USING btree ("_parent_id");
  CREATE INDEX "_kv_list_v_path_idx" ON "_kv_list_v" USING btree ("_path");
  CREATE INDEX "_trust_v_order_idx" ON "_trust_v" USING btree ("_order");
  CREATE INDEX "_trust_v_parent_id_idx" ON "_trust_v" USING btree ("_parent_id");
  CREATE INDEX "_enq_aside_v_order_idx" ON "_enq_aside_v" USING btree ("_order");
  CREATE INDEX "_enq_aside_v_parent_id_idx" ON "_enq_aside_v" USING btree ("_parent_id");
  CREATE INDEX "_enq_aside_v_path_idx" ON "_enq_aside_v" USING btree ("_path");
  CREATE INDEX "_side_card_v_items_order_idx" ON "_side_card_v_items" USING btree ("_order");
  CREATE INDEX "_side_card_v_items_parent_id_idx" ON "_side_card_v_items" USING btree ("_parent_id");
  CREATE INDEX "_side_card_v_bullets_order_idx" ON "_side_card_v_bullets" USING btree ("_order");
  CREATE INDEX "_side_card_v_bullets_parent_id_idx" ON "_side_card_v_bullets" USING btree ("_parent_id");
  CREATE INDEX "_side_card_v_order_idx" ON "_side_card_v" USING btree ("_order");
  CREATE INDEX "_side_card_v_parent_id_idx" ON "_side_card_v" USING btree ("_parent_id");
  CREATE INDEX "_side_card_v_path_idx" ON "_side_card_v" USING btree ("_path");
  CREATE INDEX "service_presentations_card_highlights_order_idx" ON "service_presentations_card_highlights" USING btree ("_order");
  CREATE INDEX "service_presentations_card_highlights_parent_id_idx" ON "service_presentations_card_highlights" USING btree ("_parent_id");
  CREATE INDEX "service_presentations_blocks_section_heading_badges_order_idx" ON "service_presentations_blocks_section_heading_badges" USING btree ("_order");
  CREATE INDEX "service_presentations_blocks_section_heading_badges_parent_id_idx" ON "service_presentations_blocks_section_heading_badges" USING btree ("_parent_id");
  CREATE INDEX "service_presentations_blocks_section_heading_order_idx" ON "service_presentations_blocks_section_heading" USING btree ("_order");
  CREATE INDEX "service_presentations_blocks_section_heading_parent_id_idx" ON "service_presentations_blocks_section_heading" USING btree ("_parent_id");
  CREATE INDEX "service_presentations_blocks_section_heading_path_idx" ON "service_presentations_blocks_section_heading" USING btree ("_path");
  CREATE INDEX "service_presentations_blocks_rich_text_order_idx" ON "service_presentations_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "service_presentations_blocks_rich_text_parent_id_idx" ON "service_presentations_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "service_presentations_blocks_rich_text_path_idx" ON "service_presentations_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "service_presentations_blocks_callout_band_order_idx" ON "service_presentations_blocks_callout_band" USING btree ("_order");
  CREATE INDEX "service_presentations_blocks_callout_band_parent_id_idx" ON "service_presentations_blocks_callout_band" USING btree ("_parent_id");
  CREATE INDEX "service_presentations_blocks_callout_band_path_idx" ON "service_presentations_blocks_callout_band" USING btree ("_path");
  CREATE INDEX "service_presentations_blocks_faq_list_items_order_idx" ON "service_presentations_blocks_faq_list_items" USING btree ("_order");
  CREATE INDEX "service_presentations_blocks_faq_list_items_parent_id_idx" ON "service_presentations_blocks_faq_list_items" USING btree ("_parent_id");
  CREATE INDEX "service_presentations_blocks_faq_list_order_idx" ON "service_presentations_blocks_faq_list" USING btree ("_order");
  CREATE INDEX "service_presentations_blocks_faq_list_parent_id_idx" ON "service_presentations_blocks_faq_list" USING btree ("_parent_id");
  CREATE INDEX "service_presentations_blocks_faq_list_path_idx" ON "service_presentations_blocks_faq_list" USING btree ("_path");
  CREATE INDEX "_service_presentations_v_version_card_highlights_order_idx" ON "_service_presentations_v_version_card_highlights" USING btree ("_order");
  CREATE INDEX "_service_presentations_v_version_card_highlights_parent_id_idx" ON "_service_presentations_v_version_card_highlights" USING btree ("_parent_id");
  CREATE INDEX "_service_presentations_v_blocks_section_heading_badges_order_idx" ON "_service_presentations_v_blocks_section_heading_badges" USING btree ("_order");
  CREATE INDEX "_service_presentations_v_blocks_section_heading_badges_parent_id_idx" ON "_service_presentations_v_blocks_section_heading_badges" USING btree ("_parent_id");
  CREATE INDEX "_service_presentations_v_blocks_section_heading_order_idx" ON "_service_presentations_v_blocks_section_heading" USING btree ("_order");
  CREATE INDEX "_service_presentations_v_blocks_section_heading_parent_id_idx" ON "_service_presentations_v_blocks_section_heading" USING btree ("_parent_id");
  CREATE INDEX "_service_presentations_v_blocks_section_heading_path_idx" ON "_service_presentations_v_blocks_section_heading" USING btree ("_path");
  CREATE INDEX "_service_presentations_v_blocks_rich_text_order_idx" ON "_service_presentations_v_blocks_rich_text" USING btree ("_order");
  CREATE INDEX "_service_presentations_v_blocks_rich_text_parent_id_idx" ON "_service_presentations_v_blocks_rich_text" USING btree ("_parent_id");
  CREATE INDEX "_service_presentations_v_blocks_rich_text_path_idx" ON "_service_presentations_v_blocks_rich_text" USING btree ("_path");
  CREATE INDEX "_service_presentations_v_blocks_callout_band_order_idx" ON "_service_presentations_v_blocks_callout_band" USING btree ("_order");
  CREATE INDEX "_service_presentations_v_blocks_callout_band_parent_id_idx" ON "_service_presentations_v_blocks_callout_band" USING btree ("_parent_id");
  CREATE INDEX "_service_presentations_v_blocks_callout_band_path_idx" ON "_service_presentations_v_blocks_callout_band" USING btree ("_path");
  CREATE INDEX "_service_presentations_v_blocks_faq_list_items_order_idx" ON "_service_presentations_v_blocks_faq_list_items" USING btree ("_order");
  CREATE INDEX "_service_presentations_v_blocks_faq_list_items_parent_id_idx" ON "_service_presentations_v_blocks_faq_list_items" USING btree ("_parent_id");
  CREATE INDEX "_service_presentations_v_blocks_faq_list_order_idx" ON "_service_presentations_v_blocks_faq_list" USING btree ("_order");
  CREATE INDEX "_service_presentations_v_blocks_faq_list_parent_id_idx" ON "_service_presentations_v_blocks_faq_list" USING btree ("_parent_id");
  CREATE INDEX "_service_presentations_v_blocks_faq_list_path_idx" ON "_service_presentations_v_blocks_faq_list" USING btree ("_path");
  CREATE INDEX "site_settings_contact_locations_order_idx" ON "site_settings_contact_locations" USING btree ("_order");
  CREATE INDEX "site_settings_contact_locations_parent_id_idx" ON "site_settings_contact_locations" USING btree ("_parent_id");
  CREATE INDEX "site_settings_enquiry_form_extra_services_order_idx" ON "site_settings_enquiry_form_extra_services" USING btree ("_order");
  CREATE INDEX "site_settings_enquiry_form_extra_services_parent_id_idx" ON "site_settings_enquiry_form_extra_services" USING btree ("_parent_id");
  ALTER TABLE "media" DROP COLUMN "_objectkey";`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_hero_trust_items" CASCADE;
  DROP TABLE "pages_blocks_section_heading_badges" CASCADE;
  DROP TABLE "pages_blocks_section_heading" CASCADE;
  DROP TABLE "pages_blocks_services_catalogue" CASCADE;
  DROP TABLE "hl" CASCADE;
  DROP TABLE "feat" CASCADE;
  DROP TABLE "feat_grid" CASCADE;
  DROP TABLE "proc_steps_steps" CASCADE;
  DROP TABLE "proc_steps" CASCADE;
  DROP TABLE "pages_blocks_statistics_items" CASCADE;
  DROP TABLE "pages_blocks_statistics" CASCADE;
  DROP TABLE "pages_blocks_services_showcase" CASCADE;
  DROP TABLE "pages_blocks_articles_preview" CASCADE;
  DROP TABLE "pages_blocks_faq_list_items" CASCADE;
  DROP TABLE "pages_blocks_faq_list" CASCADE;
  DROP TABLE "pages_blocks_callout_band" CASCADE;
  DROP TABLE "svc_hero_badges" CASCADE;
  DROP TABLE "svc_hero" CASCADE;
  DROP TABLE "kv_list_items" CASCADE;
  DROP TABLE "kv_list" CASCADE;
  DROP TABLE "trust" CASCADE;
  DROP TABLE "enq_aside" CASCADE;
  DROP TABLE "side_card_items" CASCADE;
  DROP TABLE "side_card_bullets" CASCADE;
  DROP TABLE "side_card" CASCADE;
  DROP TABLE "_pages_v_blocks_hero_trust_items" CASCADE;
  DROP TABLE "_pages_v_blocks_section_heading_badges" CASCADE;
  DROP TABLE "_pages_v_blocks_section_heading" CASCADE;
  DROP TABLE "_pages_v_blocks_services_catalogue" CASCADE;
  DROP TABLE "_hl_v" CASCADE;
  DROP TABLE "_feat_v" CASCADE;
  DROP TABLE "_feat_grid_v" CASCADE;
  DROP TABLE "_proc_steps_v_steps" CASCADE;
  DROP TABLE "_proc_steps_v" CASCADE;
  DROP TABLE "_pages_v_blocks_statistics_items" CASCADE;
  DROP TABLE "_pages_v_blocks_statistics" CASCADE;
  DROP TABLE "_pages_v_blocks_services_showcase" CASCADE;
  DROP TABLE "_pages_v_blocks_articles_preview" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_list_items" CASCADE;
  DROP TABLE "_pages_v_blocks_faq_list" CASCADE;
  DROP TABLE "_pages_v_blocks_callout_band" CASCADE;
  DROP TABLE "_svc_hero_v_badges" CASCADE;
  DROP TABLE "_svc_hero_v" CASCADE;
  DROP TABLE "_kv_list_v_items" CASCADE;
  DROP TABLE "_kv_list_v" CASCADE;
  DROP TABLE "_trust_v" CASCADE;
  DROP TABLE "_enq_aside_v" CASCADE;
  DROP TABLE "_side_card_v_items" CASCADE;
  DROP TABLE "_side_card_v_bullets" CASCADE;
  DROP TABLE "_side_card_v" CASCADE;
  DROP TABLE "service_presentations_card_highlights" CASCADE;
  DROP TABLE "service_presentations_blocks_section_heading_badges" CASCADE;
  DROP TABLE "service_presentations_blocks_section_heading" CASCADE;
  DROP TABLE "service_presentations_blocks_rich_text" CASCADE;
  DROP TABLE "service_presentations_blocks_callout_band" CASCADE;
  DROP TABLE "service_presentations_blocks_faq_list_items" CASCADE;
  DROP TABLE "service_presentations_blocks_faq_list" CASCADE;
  DROP TABLE "_service_presentations_v_version_card_highlights" CASCADE;
  DROP TABLE "_service_presentations_v_blocks_section_heading_badges" CASCADE;
  DROP TABLE "_service_presentations_v_blocks_section_heading" CASCADE;
  DROP TABLE "_service_presentations_v_blocks_rich_text" CASCADE;
  DROP TABLE "_service_presentations_v_blocks_callout_band" CASCADE;
  DROP TABLE "_service_presentations_v_blocks_faq_list_items" CASCADE;
  DROP TABLE "_service_presentations_v_blocks_faq_list" CASCADE;
  DROP TABLE "site_settings_contact_locations" CASCADE;
  DROP TABLE "site_settings_enquiry_form_extra_services" CASCADE;
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "service_presentations" DROP COLUMN "card_icon";
  ALTER TABLE "_service_presentations_v" DROP COLUMN "version_card_icon";
  ALTER TABLE "site_settings" DROP COLUMN "contact_enquiry_heading";
  ALTER TABLE "site_settings" DROP COLUMN "contact_enquiry_body";
  ALTER TABLE "site_settings" DROP COLUMN "contact_enquiry_button_label";
  ALTER TABLE "site_settings" DROP COLUMN "contact_enquiry_button_href";
  ALTER TABLE "site_settings" DROP COLUMN "contact_enquiry_form_section_title";
  ALTER TABLE "site_settings" DROP COLUMN "contact_enquiry_show_inline_form";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_field_labels_name";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_field_labels_email";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_field_labels_phone";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_field_labels_institution";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_field_labels_country";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_field_labels_service_id";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_field_labels_message";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_field_labels_submit";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_field_hints_email";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_field_hints_service_locked";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_field_hints_message";
  ALTER TABLE "site_settings" DROP COLUMN "enquiry_form_retention_footer";
  ALTER TABLE "announcement" DROP COLUMN "status_label";
  ALTER TABLE "announcement" DROP COLUMN "link_label";
  DROP TYPE "public"."enum_feat_grid_tone";
  DROP TYPE "public"."enum_proc_steps_tone";
  DROP TYPE "public"."enum_proc_steps_variant";
  DROP TYPE "public"."enum__feat_grid_v_tone";
  DROP TYPE "public"."enum__proc_steps_v_tone";
  DROP TYPE "public"."enum__proc_steps_v_variant";
  DROP TYPE "public"."enum_service_presentations_card_icon";
  DROP TYPE "public"."enum__service_presentations_v_version_card_icon";
  DROP TYPE "public"."enum_site_settings_contact_locations_icon";`);
}
