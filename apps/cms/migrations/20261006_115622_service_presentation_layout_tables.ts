import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_sp_fgrid_tone" AS ENUM('surface', 'surface-tint', 'surface-tint-2');
  CREATE TYPE "public"."enum_sp_steps_tone" AS ENUM('surface', 'surface-tint', 'surface-tint-2');
  CREATE TYPE "public"."enum_sp_steps_variant" AS ENUM('grid', 'timeline', 'numbered');
  CREATE TYPE "public"."enum__sp_fgrid_v_tone" AS ENUM('surface', 'surface-tint', 'surface-tint-2');
  CREATE TYPE "public"."enum__sp_steps_v_tone" AS ENUM('surface', 'surface-tint', 'surface-tint-2');
  CREATE TYPE "public"."enum__sp_steps_v_variant" AS ENUM('grid', 'timeline', 'numbered');
  CREATE TABLE "sp_hero_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "sp_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"notice_title" varchar,
  	"notice_body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sp_fgrid" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"tone" "enum_sp_fgrid_tone" DEFAULT 'surface',
  	"centered" boolean DEFAULT false,
  	"block_name" varchar
  );
  
  CREATE TABLE "sp_steps_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "sp_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"tone" "enum_sp_steps_tone" DEFAULT 'surface',
  	"variant" "enum_sp_steps_variant" DEFAULT 'grid',
  	"block_name" varchar
  );
  
  CREATE TABLE "sp_kv_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "sp_kv" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "sp_enq" (
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
  
  CREATE TABLE "sp_side_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar
  );
  
  CREATE TABLE "sp_side_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "sp_side" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_sp_hero_v_badges" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sp_hero_v" (
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
  
  CREATE TABLE "_sp_fgrid_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"tone" "enum__sp_fgrid_v_tone" DEFAULT 'surface',
  	"centered" boolean DEFAULT false,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_sp_steps_v_steps" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sp_steps_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"eyebrow" varchar,
  	"heading" varchar,
  	"body" varchar,
  	"tone" "enum__sp_steps_v_tone" DEFAULT 'surface',
  	"variant" "enum__sp_steps_v_variant" DEFAULT 'grid',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_sp_kv_v_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sp_kv_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_sp_enq_v" (
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
  
  CREATE TABLE "_sp_side_v_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"detail" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sp_side_v_bullets" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sp_side_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"body" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "sp_hero_badges" ADD CONSTRAINT "sp_hero_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sp_hero"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_hero" ADD CONSTRAINT "sp_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_fgrid" ADD CONSTRAINT "sp_fgrid_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_steps_steps" ADD CONSTRAINT "sp_steps_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sp_steps"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_steps" ADD CONSTRAINT "sp_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_kv_items" ADD CONSTRAINT "sp_kv_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sp_kv"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_kv" ADD CONSTRAINT "sp_kv_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_enq" ADD CONSTRAINT "sp_enq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_side_items" ADD CONSTRAINT "sp_side_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sp_side"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_side_bullets" ADD CONSTRAINT "sp_side_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sp_side"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_side" ADD CONSTRAINT "sp_side_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_hero_v_badges" ADD CONSTRAINT "_sp_hero_v_badges_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sp_hero_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_hero_v" ADD CONSTRAINT "_sp_hero_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_fgrid_v" ADD CONSTRAINT "_sp_fgrid_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_steps_v_steps" ADD CONSTRAINT "_sp_steps_v_steps_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sp_steps_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_steps_v" ADD CONSTRAINT "_sp_steps_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_kv_v_items" ADD CONSTRAINT "_sp_kv_v_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sp_kv_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_kv_v" ADD CONSTRAINT "_sp_kv_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_enq_v" ADD CONSTRAINT "_sp_enq_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_side_v_items" ADD CONSTRAINT "_sp_side_v_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sp_side_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_side_v_bullets" ADD CONSTRAINT "_sp_side_v_bullets_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sp_side_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_side_v" ADD CONSTRAINT "_sp_side_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sp_hero_badges_order_idx" ON "sp_hero_badges" USING btree ("_order");
  CREATE INDEX "sp_hero_badges_parent_id_idx" ON "sp_hero_badges" USING btree ("_parent_id");
  CREATE INDEX "sp_hero_order_idx" ON "sp_hero" USING btree ("_order");
  CREATE INDEX "sp_hero_parent_id_idx" ON "sp_hero" USING btree ("_parent_id");
  CREATE INDEX "sp_hero_path_idx" ON "sp_hero" USING btree ("_path");
  CREATE INDEX "sp_fgrid_order_idx" ON "sp_fgrid" USING btree ("_order");
  CREATE INDEX "sp_fgrid_parent_id_idx" ON "sp_fgrid" USING btree ("_parent_id");
  CREATE INDEX "sp_fgrid_path_idx" ON "sp_fgrid" USING btree ("_path");
  CREATE INDEX "sp_steps_steps_order_idx" ON "sp_steps_steps" USING btree ("_order");
  CREATE INDEX "sp_steps_steps_parent_id_idx" ON "sp_steps_steps" USING btree ("_parent_id");
  CREATE INDEX "sp_steps_order_idx" ON "sp_steps" USING btree ("_order");
  CREATE INDEX "sp_steps_parent_id_idx" ON "sp_steps" USING btree ("_parent_id");
  CREATE INDEX "sp_steps_path_idx" ON "sp_steps" USING btree ("_path");
  CREATE INDEX "sp_kv_items_order_idx" ON "sp_kv_items" USING btree ("_order");
  CREATE INDEX "sp_kv_items_parent_id_idx" ON "sp_kv_items" USING btree ("_parent_id");
  CREATE INDEX "sp_kv_order_idx" ON "sp_kv" USING btree ("_order");
  CREATE INDEX "sp_kv_parent_id_idx" ON "sp_kv" USING btree ("_parent_id");
  CREATE INDEX "sp_kv_path_idx" ON "sp_kv" USING btree ("_path");
  CREATE INDEX "sp_enq_order_idx" ON "sp_enq" USING btree ("_order");
  CREATE INDEX "sp_enq_parent_id_idx" ON "sp_enq" USING btree ("_parent_id");
  CREATE INDEX "sp_enq_path_idx" ON "sp_enq" USING btree ("_path");
  CREATE INDEX "sp_side_items_order_idx" ON "sp_side_items" USING btree ("_order");
  CREATE INDEX "sp_side_items_parent_id_idx" ON "sp_side_items" USING btree ("_parent_id");
  CREATE INDEX "sp_side_bullets_order_idx" ON "sp_side_bullets" USING btree ("_order");
  CREATE INDEX "sp_side_bullets_parent_id_idx" ON "sp_side_bullets" USING btree ("_parent_id");
  CREATE INDEX "sp_side_order_idx" ON "sp_side" USING btree ("_order");
  CREATE INDEX "sp_side_parent_id_idx" ON "sp_side" USING btree ("_parent_id");
  CREATE INDEX "sp_side_path_idx" ON "sp_side" USING btree ("_path");
  CREATE INDEX "_sp_hero_v_badges_order_idx" ON "_sp_hero_v_badges" USING btree ("_order");
  CREATE INDEX "_sp_hero_v_badges_parent_id_idx" ON "_sp_hero_v_badges" USING btree ("_parent_id");
  CREATE INDEX "_sp_hero_v_order_idx" ON "_sp_hero_v" USING btree ("_order");
  CREATE INDEX "_sp_hero_v_parent_id_idx" ON "_sp_hero_v" USING btree ("_parent_id");
  CREATE INDEX "_sp_hero_v_path_idx" ON "_sp_hero_v" USING btree ("_path");
  CREATE INDEX "_sp_fgrid_v_order_idx" ON "_sp_fgrid_v" USING btree ("_order");
  CREATE INDEX "_sp_fgrid_v_parent_id_idx" ON "_sp_fgrid_v" USING btree ("_parent_id");
  CREATE INDEX "_sp_fgrid_v_path_idx" ON "_sp_fgrid_v" USING btree ("_path");
  CREATE INDEX "_sp_steps_v_steps_order_idx" ON "_sp_steps_v_steps" USING btree ("_order");
  CREATE INDEX "_sp_steps_v_steps_parent_id_idx" ON "_sp_steps_v_steps" USING btree ("_parent_id");
  CREATE INDEX "_sp_steps_v_order_idx" ON "_sp_steps_v" USING btree ("_order");
  CREATE INDEX "_sp_steps_v_parent_id_idx" ON "_sp_steps_v" USING btree ("_parent_id");
  CREATE INDEX "_sp_steps_v_path_idx" ON "_sp_steps_v" USING btree ("_path");
  CREATE INDEX "_sp_kv_v_items_order_idx" ON "_sp_kv_v_items" USING btree ("_order");
  CREATE INDEX "_sp_kv_v_items_parent_id_idx" ON "_sp_kv_v_items" USING btree ("_parent_id");
  CREATE INDEX "_sp_kv_v_order_idx" ON "_sp_kv_v" USING btree ("_order");
  CREATE INDEX "_sp_kv_v_parent_id_idx" ON "_sp_kv_v" USING btree ("_parent_id");
  CREATE INDEX "_sp_kv_v_path_idx" ON "_sp_kv_v" USING btree ("_path");
  CREATE INDEX "_sp_enq_v_order_idx" ON "_sp_enq_v" USING btree ("_order");
  CREATE INDEX "_sp_enq_v_parent_id_idx" ON "_sp_enq_v" USING btree ("_parent_id");
  CREATE INDEX "_sp_enq_v_path_idx" ON "_sp_enq_v" USING btree ("_path");
  CREATE INDEX "_sp_side_v_items_order_idx" ON "_sp_side_v_items" USING btree ("_order");
  CREATE INDEX "_sp_side_v_items_parent_id_idx" ON "_sp_side_v_items" USING btree ("_parent_id");
  CREATE INDEX "_sp_side_v_bullets_order_idx" ON "_sp_side_v_bullets" USING btree ("_order");
  CREATE INDEX "_sp_side_v_bullets_parent_id_idx" ON "_sp_side_v_bullets" USING btree ("_parent_id");
  CREATE INDEX "_sp_side_v_order_idx" ON "_sp_side_v" USING btree ("_order");
  CREATE INDEX "_sp_side_v_parent_id_idx" ON "_sp_side_v" USING btree ("_parent_id");
  CREATE INDEX "_sp_side_v_path_idx" ON "_sp_side_v" USING btree ("_path");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sp_hero_badges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_hero" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_fgrid" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_steps_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_kv_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_kv" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_enq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_side_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_side_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_side" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_hero_v_badges" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_hero_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_fgrid_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_steps_v_steps" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_steps_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_kv_v_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_kv_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_enq_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_side_v_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_side_v_bullets" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_side_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sp_hero_badges" CASCADE;
  DROP TABLE "sp_hero" CASCADE;
  DROP TABLE "sp_fgrid" CASCADE;
  DROP TABLE "sp_steps_steps" CASCADE;
  DROP TABLE "sp_steps" CASCADE;
  DROP TABLE "sp_kv_items" CASCADE;
  DROP TABLE "sp_kv" CASCADE;
  DROP TABLE "sp_enq" CASCADE;
  DROP TABLE "sp_side_items" CASCADE;
  DROP TABLE "sp_side_bullets" CASCADE;
  DROP TABLE "sp_side" CASCADE;
  DROP TABLE "_sp_hero_v_badges" CASCADE;
  DROP TABLE "_sp_hero_v" CASCADE;
  DROP TABLE "_sp_fgrid_v" CASCADE;
  DROP TABLE "_sp_steps_v_steps" CASCADE;
  DROP TABLE "_sp_steps_v" CASCADE;
  DROP TABLE "_sp_kv_v_items" CASCADE;
  DROP TABLE "_sp_kv_v" CASCADE;
  DROP TABLE "_sp_enq_v" CASCADE;
  DROP TABLE "_sp_side_v_items" CASCADE;
  DROP TABLE "_sp_side_v_bullets" CASCADE;
  DROP TABLE "_sp_side_v" CASCADE;
  DROP TYPE "public"."enum_sp_fgrid_tone";
  DROP TYPE "public"."enum_sp_steps_tone";
  DROP TYPE "public"."enum_sp_steps_variant";
  DROP TYPE "public"."enum__sp_fgrid_v_tone";
  DROP TYPE "public"."enum__sp_steps_v_tone";
  DROP TYPE "public"."enum__sp_steps_v_variant";`);
}
