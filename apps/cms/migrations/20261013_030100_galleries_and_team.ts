import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "pages_team_members_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "pages_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"photo_id" integer,
  	"biography" varchar
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_pages_v_version_team_members_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_version_team_members" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" varchar,
  	"photo_id" integer,
  	"biography" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "service_presentations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "_service_presentations_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  ALTER TABLE "pages" ADD COLUMN "gallery_heading" varchar;
  ALTER TABLE "pages" ADD COLUMN "team_heading" varchar DEFAULT 'Our team';
  ALTER TABLE "pages" ADD COLUMN "team_introduction" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_gallery_heading" varchar;
  ALTER TABLE "_pages_v" ADD COLUMN "version_team_heading" varchar DEFAULT 'Our team';
  ALTER TABLE "_pages_v" ADD COLUMN "version_team_introduction" varchar;
  ALTER TABLE "posts" ADD COLUMN "gallery_heading" varchar;
  ALTER TABLE "_posts_v" ADD COLUMN "version_gallery_heading" varchar;
  ALTER TABLE "service_presentations" ADD COLUMN "gallery_heading" varchar;
  ALTER TABLE "_service_presentations_v" ADD COLUMN "version_gallery_heading" varchar;
  ALTER TABLE "pages_team_members_links" ADD CONSTRAINT "pages_team_members_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_team_members" ADD CONSTRAINT "pages_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_team_members" ADD CONSTRAINT "pages_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_team_members_links" ADD CONSTRAINT "_pages_v_version_team_members_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_version_team_members"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_team_members" ADD CONSTRAINT "_pages_v_version_team_members_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_version_team_members" ADD CONSTRAINT "_pages_v_version_team_members_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_presentations_rels" ADD CONSTRAINT "service_presentations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_presentations_rels" ADD CONSTRAINT "service_presentations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_service_presentations_v_rels" ADD CONSTRAINT "_service_presentations_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_service_presentations_v_rels" ADD CONSTRAINT "_service_presentations_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_team_members_links_order_idx" ON "pages_team_members_links" USING btree ("_order");
  CREATE INDEX "pages_team_members_links_parent_id_idx" ON "pages_team_members_links" USING btree ("_parent_id");
  CREATE INDEX "pages_team_members_order_idx" ON "pages_team_members" USING btree ("_order");
  CREATE INDEX "pages_team_members_parent_id_idx" ON "pages_team_members" USING btree ("_parent_id");
  CREATE INDEX "pages_team_members_photo_idx" ON "pages_team_members" USING btree ("photo_id");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_media_id_idx" ON "pages_rels" USING btree ("media_id");
  CREATE INDEX "_pages_v_version_team_members_links_order_idx" ON "_pages_v_version_team_members_links" USING btree ("_order");
  CREATE INDEX "_pages_v_version_team_members_links_parent_id_idx" ON "_pages_v_version_team_members_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_team_members_order_idx" ON "_pages_v_version_team_members" USING btree ("_order");
  CREATE INDEX "_pages_v_version_team_members_parent_id_idx" ON "_pages_v_version_team_members" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_version_team_members_photo_idx" ON "_pages_v_version_team_members" USING btree ("photo_id");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_media_id_idx" ON "_pages_v_rels" USING btree ("media_id");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_media_id_idx" ON "posts_rels" USING btree ("media_id");
  CREATE INDEX "_posts_v_rels_order_idx" ON "_posts_v_rels" USING btree ("order");
  CREATE INDEX "_posts_v_rels_parent_idx" ON "_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_posts_v_rels_path_idx" ON "_posts_v_rels" USING btree ("path");
  CREATE INDEX "_posts_v_rels_media_id_idx" ON "_posts_v_rels" USING btree ("media_id");
  CREATE INDEX "service_presentations_rels_order_idx" ON "service_presentations_rels" USING btree ("order");
  CREATE INDEX "service_presentations_rels_parent_idx" ON "service_presentations_rels" USING btree ("parent_id");
  CREATE INDEX "service_presentations_rels_path_idx" ON "service_presentations_rels" USING btree ("path");
  CREATE INDEX "service_presentations_rels_media_id_idx" ON "service_presentations_rels" USING btree ("media_id");
  CREATE INDEX "_service_presentations_v_rels_order_idx" ON "_service_presentations_v_rels" USING btree ("order");
  CREATE INDEX "_service_presentations_v_rels_parent_idx" ON "_service_presentations_v_rels" USING btree ("parent_id");
  CREATE INDEX "_service_presentations_v_rels_path_idx" ON "_service_presentations_v_rels" USING btree ("path");
  CREATE INDEX "_service_presentations_v_rels_media_id_idx" ON "_service_presentations_v_rels" USING btree ("media_id");
`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_team_members_links" CASCADE;
  DROP TABLE "pages_team_members" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_version_team_members_links" CASCADE;
  DROP TABLE "_pages_v_version_team_members" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "_posts_v_rels" CASCADE;
  DROP TABLE "service_presentations_rels" CASCADE;
  DROP TABLE "_service_presentations_v_rels" CASCADE;

  ALTER TABLE "pages" DROP COLUMN "gallery_heading";
  ALTER TABLE "pages" DROP COLUMN "team_heading";
  ALTER TABLE "pages" DROP COLUMN "team_introduction";
  ALTER TABLE "_pages_v" DROP COLUMN "version_gallery_heading";
  ALTER TABLE "_pages_v" DROP COLUMN "version_team_heading";
  ALTER TABLE "_pages_v" DROP COLUMN "version_team_introduction";
  ALTER TABLE "posts" DROP COLUMN "gallery_heading";
  ALTER TABLE "_posts_v" DROP COLUMN "version_gallery_heading";
  ALTER TABLE "service_presentations" DROP COLUMN "gallery_heading";
  ALTER TABLE "_service_presentations_v" DROP COLUMN "version_gallery_heading";`);
}
