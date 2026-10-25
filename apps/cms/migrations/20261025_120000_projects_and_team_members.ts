import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

/** Additive schema for CMS-managed public projects and gated team profiles. */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_projects_project_status" AS ENUM('running', 'completed');
    CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
    CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
    CREATE TYPE "public"."enum_team_members_status" AS ENUM('draft', 'published');
    CREATE TYPE "public"."enum__team_members_v_version_status" AS ENUM('draft', 'published');

    CREATE TABLE "projects" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "seo_title" varchar,
      "seo_description" varchar,
      "seo_canonical_url" varchar,
      "seo_og_image_id" integer,
      "seo_no_index" boolean DEFAULT false,
      "review_requested" boolean DEFAULT false,
      "author_id" varchar,
      "approver_id" varchar,
      "published_at" timestamp(3) with time zone,
      "fixture" boolean DEFAULT false,
      "category" varchar NOT NULL,
      "project_status" "enum_projects_project_status" NOT NULL,
      "summary" varchar NOT NULL,
      "featured" boolean DEFAULT false,
      "publication_url" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_projects_status" DEFAULT 'draft'
    );
    CREATE TABLE "_projects_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_title" varchar,
      "version_slug" varchar,
      "version_seo_title" varchar,
      "version_seo_description" varchar,
      "version_seo_canonical_url" varchar,
      "version_seo_og_image_id" integer,
      "version_seo_no_index" boolean DEFAULT false,
      "version_review_requested" boolean DEFAULT false,
      "version_author_id" varchar,
      "version_approver_id" varchar,
      "version_published_at" timestamp(3) with time zone,
      "version_fixture" boolean DEFAULT false,
      "version_category" varchar,
      "version_project_status" "enum_projects_project_status",
      "version_summary" varchar,
      "version_featured" boolean DEFAULT false,
      "version_publication_url" varchar,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__projects_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean,
      "autosave" boolean
    );
    CREATE TABLE "team_members" (
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "seo_title" varchar,
      "seo_description" varchar,
      "seo_canonical_url" varchar,
      "seo_og_image_id" integer,
      "seo_no_index" boolean DEFAULT false,
      "review_requested" boolean DEFAULT false,
      "author_id" varchar,
      "approver_id" varchar,
      "published_at" timestamp(3) with time zone,
      "fixture" boolean DEFAULT false,
      "name" varchar NOT NULL,
      "role" varchar NOT NULL,
      "designation" varchar NOT NULL,
      "affiliation" varchar NOT NULL,
      "photo_id" integer,
      "display_order" numeric DEFAULT 0 NOT NULL,
      "client_confirmed" boolean DEFAULT false,
      "photo_approved" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "_status" "enum_team_members_status" DEFAULT 'draft'
    );
    CREATE TABLE "_team_members_v" (
      "id" serial PRIMARY KEY NOT NULL,
      "parent_id" integer,
      "version_title" varchar,
      "version_slug" varchar,
      "version_seo_title" varchar,
      "version_seo_description" varchar,
      "version_seo_canonical_url" varchar,
      "version_seo_og_image_id" integer,
      "version_seo_no_index" boolean DEFAULT false,
      "version_review_requested" boolean DEFAULT false,
      "version_author_id" varchar,
      "version_approver_id" varchar,
      "version_published_at" timestamp(3) with time zone,
      "version_fixture" boolean DEFAULT false,
      "version_name" varchar,
      "version_role" varchar,
      "version_designation" varchar,
      "version_affiliation" varchar,
      "version_photo_id" integer,
      "version_display_order" numeric DEFAULT 0,
      "version_client_confirmed" boolean DEFAULT false,
      "version_photo_approved" boolean DEFAULT false,
      "version_updated_at" timestamp(3) with time zone,
      "version_created_at" timestamp(3) with time zone,
      "version__status" "enum__team_members_v_version_status" DEFAULT 'draft',
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "latest" boolean,
      "autosave" boolean
    );

    ALTER TABLE "projects" ADD CONSTRAINT "projects_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "team_members" ADD CONSTRAINT "team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "team_members" ADD CONSTRAINT "team_members_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_team_members_v" ADD CONSTRAINT "_team_members_v_parent_id_team_members_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_team_members_v" ADD CONSTRAINT "_team_members_v_version_photo_id_media_id_fk" FOREIGN KEY ("version_photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    ALTER TABLE "_team_members_v" ADD CONSTRAINT "_team_members_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "team_members_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_team_members_fk" FOREIGN KEY ("team_members_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
    CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
    CREATE UNIQUE INDEX "projects_slug_idx" ON "projects" USING btree ("slug");
    CREATE INDEX "projects_seo_seo_og_image_idx" ON "projects" USING btree ("seo_og_image_id");
    CREATE INDEX "projects__status_idx" ON "projects" USING btree ("_status");
    CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
    CREATE INDEX "_projects_v_version_version_slug_idx" ON "_projects_v" USING btree ("version_slug");
    CREATE INDEX "_projects_v_version_seo_version_seo_og_image_idx" ON "_projects_v" USING btree ("version_seo_og_image_id");
    CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
    CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
    CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
    CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
    CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
    CREATE INDEX "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
    CREATE INDEX "_projects_v_autosave_idx" ON "_projects_v" USING btree ("autosave");
    CREATE INDEX "team_members_updated_at_idx" ON "team_members" USING btree ("updated_at");
    CREATE INDEX "team_members_created_at_idx" ON "team_members" USING btree ("created_at");
    CREATE UNIQUE INDEX "team_members_slug_idx" ON "team_members" USING btree ("slug");
    CREATE INDEX "team_members_seo_seo_og_image_idx" ON "team_members" USING btree ("seo_og_image_id");
    CREATE INDEX "team_members_photo_idx" ON "team_members" USING btree ("photo_id");
    CREATE INDEX "team_members__status_idx" ON "team_members" USING btree ("_status");
    CREATE INDEX "_team_members_v_parent_idx" ON "_team_members_v" USING btree ("parent_id");
    CREATE INDEX "_team_members_v_version_version_slug_idx" ON "_team_members_v" USING btree ("version_slug");
    CREATE INDEX "_team_members_v_version_seo_version_seo_og_image_idx" ON "_team_members_v" USING btree ("version_seo_og_image_id");
    CREATE INDEX "_team_members_v_version_version_photo_idx" ON "_team_members_v" USING btree ("version_photo_id");
    CREATE INDEX "_team_members_v_version_version_updated_at_idx" ON "_team_members_v" USING btree ("version_updated_at");
    CREATE INDEX "_team_members_v_version_version_created_at_idx" ON "_team_members_v" USING btree ("version_created_at");
    CREATE INDEX "_team_members_v_version_version__status_idx" ON "_team_members_v" USING btree ("version__status");
    CREATE INDEX "_team_members_v_created_at_idx" ON "_team_members_v" USING btree ("created_at");
    CREATE INDEX "_team_members_v_updated_at_idx" ON "_team_members_v" USING btree ("updated_at");
    CREATE INDEX "_team_members_v_latest_idx" ON "_team_members_v" USING btree ("latest");
    CREATE INDEX "_team_members_v_autosave_idx" ON "_team_members_v" USING btree ("autosave");
    CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
    CREATE INDEX "payload_locked_documents_rels_team_members_id_idx" ON "payload_locked_documents_rels" USING btree ("team_members_id");

    -- Retain the six legacy technical articles for editors, but remove them
    -- from public listings and feeds. Their content and history stay intact.
    UPDATE "posts"
    SET "_status" = 'draft'
    WHERE "slug" IN (
      'planning-metagenomic-submissions',
      'omics-quality-control-basics',
      'preclinical-study-handoff',
      'confocal-imaging-in-the-laboratory',
      'plate-based-assays-and-readout',
      'documenting-laboratory-methods'
    );
    UPDATE "_posts_v"
    SET "version__status" = 'draft'
    WHERE "version_slug" IN (
      'planning-metagenomic-submissions',
      'omics-quality-control-basics',
      'preclinical-study-handoff',
      'confocal-imaging-in-the-laboratory',
      'plate-based-assays-and-readout',
      'documenting-laboratory-methods'
    );
  `);
}

/** Deliberately non-destructive: this migration is forward-only. */
export async function down(_args: MigrateDownArgs): Promise<void> {}
