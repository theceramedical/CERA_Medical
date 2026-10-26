import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN
    IF to_regtype('public.enum_projects_category') IS NULL THEN
      CREATE TYPE "public"."enum_projects_category" AS ENUM('Preclinical Studies', 'Molecular Research', 'Biomedical Data Analysis');
    END IF;
   END $$;
   DO $$ BEGIN
    IF to_regtype('public.enum_projects_project_status') IS NULL THEN
      CREATE TYPE "public"."enum_projects_project_status" AS ENUM('Running', 'Completed');
    END IF;
   END $$;
   DO $$ BEGIN
    IF to_regtype('public.enum_projects_status') IS NULL THEN
      CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
    END IF;
   END $$;
   DO $$ BEGIN
    IF to_regtype('public.enum__projects_v_version_category') IS NULL THEN
      CREATE TYPE "public"."enum__projects_v_version_category" AS ENUM('Preclinical Studies', 'Molecular Research', 'Biomedical Data Analysis');
    END IF;
   END $$;
   DO $$ BEGIN
    IF to_regtype('public.enum__projects_v_version_project_status') IS NULL THEN
      CREATE TYPE "public"."enum__projects_v_version_project_status" AS ENUM('Running', 'Completed');
    END IF;
   END $$;
   DO $$ BEGIN
    IF to_regtype('public.enum__projects_v_version_status') IS NULL THEN
      CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
    END IF;
   END $$;
  CREATE TABLE IF NOT EXISTS "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar,
	"slug" varchar,
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
	"summary" varchar,
	"category" "enum_projects_category",
	"project_status" "enum_projects_project_status",
	"sort_order" numeric DEFAULT 0,
	"featured_on_home" boolean DEFAULT false,
	"image_id" integer,
	"image_alt" varchar,
	"publication_url" varchar,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"_status" "enum_projects_status" DEFAULT 'draft'
  );

  CREATE TABLE IF NOT EXISTS "_projects_v" (
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
	"version_summary" varchar,
	"version_category" "enum__projects_v_version_category",
	"version_project_status" "enum__projects_v_version_project_status",
	"version_sort_order" numeric DEFAULT 0,
	"version_featured_on_home" boolean DEFAULT false,
	"version_image_id" integer,
	"version_image_alt" varchar,
	"version_publication_url" varchar,
	"version_updated_at" timestamp(3) with time zone,
	"version_created_at" timestamp(3) with time zone,
	"version__status" "enum__projects_v_version_status" DEFAULT 'draft',
	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
	"latest" boolean,
	"autosave" boolean
  );

  CREATE TABLE IF NOT EXISTS "pts" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"text" varchar
  );

  CREATE TABLE IF NOT EXISTS "sec" (
	"_order" integer NOT NULL,
	"_parent_id" varchar NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"anchor" varchar,
	"heading" varchar,
	"description" varchar
  );

  CREATE TABLE IF NOT EXISTS "svc_sec" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" varchar PRIMARY KEY NOT NULL,
	"block_name" varchar
  );

  CREATE TABLE IF NOT EXISTS "_pts_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"text" varchar,
	"_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "_sec_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"anchor" varchar,
	"heading" varchar,
	"description" varchar,
	"_uuid" varchar
  );

  CREATE TABLE IF NOT EXISTS "_svc_sec_v" (
	"_order" integer NOT NULL,
	"_parent_id" integer NOT NULL,
	"_path" text NOT NULL,
	"id" serial PRIMARY KEY NOT NULL,
	"_uuid" varchar,
	"block_name" varchar
  );

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "projects_id" integer;
  DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_seo_og_image_id_media_id_fk' AND conrelid = 'public.projects'::regclass) THEN
      ALTER TABLE "projects" ADD CONSTRAINT "projects_seo_og_image_id_media_id_fk" FOREIGN KEY ("seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'projects_image_id_media_id_fk' AND conrelid = 'public.projects'::regclass) THEN
      ALTER TABLE "projects" ADD CONSTRAINT "projects_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_projects_v_parent_id_projects_id_fk' AND conrelid = 'public._projects_v'::regclass) THEN
      ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_projects_v_version_seo_og_image_id_media_id_fk' AND conrelid = 'public._projects_v'::regclass) THEN
      ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_seo_og_image_id_media_id_fk" FOREIGN KEY ("version_seo_og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_projects_v_version_image_id_media_id_fk' AND conrelid = 'public._projects_v'::regclass) THEN
      ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_image_id_media_id_fk" FOREIGN KEY ("version_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pts_parent_id_fk' AND conrelid = 'public.pts'::regclass) THEN
      ALTER TABLE "pts" ADD CONSTRAINT "pts_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sec"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sec_parent_id_fk' AND conrelid = 'public.sec'::regclass) THEN
      ALTER TABLE "sec" ADD CONSTRAINT "sec_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."svc_sec"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'svc_sec_parent_id_fk' AND conrelid = 'public.svc_sec'::regclass) THEN
      ALTER TABLE "svc_sec" ADD CONSTRAINT "svc_sec_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_pts_v_parent_id_fk' AND conrelid = 'public._pts_v'::regclass) THEN
      ALTER TABLE "_pts_v" ADD CONSTRAINT "_pts_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sec_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_sec_v_parent_id_fk' AND conrelid = 'public._sec_v'::regclass) THEN
      ALTER TABLE "_sec_v" ADD CONSTRAINT "_sec_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_svc_sec_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_svc_sec_v_parent_id_fk' AND conrelid = 'public._svc_sec_v'::regclass) THEN
      ALTER TABLE "_svc_sec_v" ADD CONSTRAINT "_svc_sec_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payload_locked_documents_rels_projects_fk' AND conrelid = 'public.payload_locked_documents_rels'::regclass) THEN
      ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
  END $$;
  CREATE UNIQUE INDEX IF NOT EXISTS "projects_slug_idx" ON "projects" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "projects_seo_seo_og_image_idx" ON "projects" USING btree ("seo_og_image_id");
  CREATE INDEX IF NOT EXISTS "projects_image_idx" ON "projects" USING btree ("image_id");
  CREATE INDEX IF NOT EXISTS "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version_slug_idx" ON "_projects_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_seo_version_seo_og_image_idx" ON "_projects_v" USING btree ("version_seo_og_image_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version_image_idx" ON "_projects_v" USING btree ("version_image_id");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_projects_v_autosave_idx" ON "_projects_v" USING btree ("autosave");
  CREATE INDEX IF NOT EXISTS "pts_order_idx" ON "pts" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pts_parent_id_idx" ON "pts" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "sec_order_idx" ON "sec" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "sec_parent_id_idx" ON "sec" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "svc_sec_order_idx" ON "svc_sec" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "svc_sec_parent_id_idx" ON "svc_sec" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "svc_sec_path_idx" ON "svc_sec" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pts_v_order_idx" ON "_pts_v" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pts_v_parent_id_idx" ON "_pts_v" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_sec_v_order_idx" ON "_sec_v" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_sec_v_parent_id_idx" ON "_sec_v" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_svc_sec_v_order_idx" ON "_svc_sec_v" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_svc_sec_v_parent_id_idx" ON "_svc_sec_v" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_svc_sec_v_path_idx" ON "_svc_sec_v" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sec" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "svc_sec" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pts_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sec_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_svc_sec_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  DROP TABLE "pts" CASCADE;
  DROP TABLE "sec" CASCADE;
  DROP TABLE "svc_sec" CASCADE;
  DROP TABLE "_pts_v" CASCADE;
  DROP TABLE "_sec_v" CASCADE;
  DROP TABLE "_svc_sec_v" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_projects_fk";

  DROP INDEX "payload_locked_documents_rels_projects_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "projects_id";
  DROP TYPE "public"."enum_projects_category";
  DROP TYPE "public"."enum_projects_project_status";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum__projects_v_version_category";
  DROP TYPE "public"."enum__projects_v_version_project_status";
  DROP TYPE "public"."enum__projects_v_version_status";`);
}
