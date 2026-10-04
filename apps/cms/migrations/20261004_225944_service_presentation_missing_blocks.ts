import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "service_presentations_blocks_cta_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"headline" varchar,
  	"body" varchar,
  	"href" varchar DEFAULT '/enquiry',
  	"label" varchar DEFAULT 'Make an Enquiry',
  	"block_name" varchar
  );
  
  CREATE TABLE "_service_presentations_v_blocks_cta_band" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"headline" varchar,
  	"body" varchar,
  	"href" varchar DEFAULT '/enquiry',
  	"label" varchar DEFAULT 'Make an Enquiry',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "media" ADD COLUMN "_objectkey" varchar;
  ALTER TABLE "service_presentations_blocks_cta_band" ADD CONSTRAINT "service_presentations_blocks_cta_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."service_presentations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_service_presentations_v_blocks_cta_band" ADD CONSTRAINT "_service_presentations_v_blocks_cta_band_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_service_presentations_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "service_presentations_blocks_cta_band_order_idx" ON "service_presentations_blocks_cta_band" USING btree ("_order");
  CREATE INDEX "service_presentations_blocks_cta_band_parent_id_idx" ON "service_presentations_blocks_cta_band" USING btree ("_parent_id");
  CREATE INDEX "service_presentations_blocks_cta_band_path_idx" ON "service_presentations_blocks_cta_band" USING btree ("_path");
  CREATE INDEX "_service_presentations_v_blocks_cta_band_order_idx" ON "_service_presentations_v_blocks_cta_band" USING btree ("_order");
  CREATE INDEX "_service_presentations_v_blocks_cta_band_parent_id_idx" ON "_service_presentations_v_blocks_cta_band" USING btree ("_parent_id");
  CREATE INDEX "_service_presentations_v_blocks_cta_band_path_idx" ON "_service_presentations_v_blocks_cta_band" USING btree ("_path");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "service_presentations_blocks_cta_band" CASCADE;
  DROP TABLE "_service_presentations_v_blocks_cta_band" CASCADE;
  ALTER TABLE "media" DROP COLUMN "_objectkey";`);
}
