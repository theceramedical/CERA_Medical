import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "sp_hl" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "sp_feat" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"href" varchar,
  	"link_label" varchar
  );
  
  CREATE TABLE "sp_trust" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "_sp_hl_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sp_feat_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"href" varchar,
  	"link_label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_sp_trust_v" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  ALTER TABLE "sp_hl" ADD CONSTRAINT "sp_hl_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sp_feat"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_feat" ADD CONSTRAINT "sp_feat_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sp_fgrid"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sp_trust" ADD CONSTRAINT "sp_trust_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sp_enq"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_hl_v" ADD CONSTRAINT "_sp_hl_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sp_feat_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_feat_v" ADD CONSTRAINT "_sp_feat_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sp_fgrid_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sp_trust_v" ADD CONSTRAINT "_sp_trust_v_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sp_enq_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "sp_hl_order_idx" ON "sp_hl" USING btree ("_order");
  CREATE INDEX "sp_hl_parent_id_idx" ON "sp_hl" USING btree ("_parent_id");
  CREATE INDEX "sp_feat_order_idx" ON "sp_feat" USING btree ("_order");
  CREATE INDEX "sp_feat_parent_id_idx" ON "sp_feat" USING btree ("_parent_id");
  CREATE INDEX "sp_trust_order_idx" ON "sp_trust" USING btree ("_order");
  CREATE INDEX "sp_trust_parent_id_idx" ON "sp_trust" USING btree ("_parent_id");
  CREATE INDEX "_sp_hl_v_order_idx" ON "_sp_hl_v" USING btree ("_order");
  CREATE INDEX "_sp_hl_v_parent_id_idx" ON "_sp_hl_v" USING btree ("_parent_id");
  CREATE INDEX "_sp_feat_v_order_idx" ON "_sp_feat_v" USING btree ("_order");
  CREATE INDEX "_sp_feat_v_parent_id_idx" ON "_sp_feat_v" USING btree ("_parent_id");
  CREATE INDEX "_sp_trust_v_order_idx" ON "_sp_trust_v" USING btree ("_order");
  CREATE INDEX "_sp_trust_v_parent_id_idx" ON "_sp_trust_v" USING btree ("_parent_id");`);
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "sp_hl" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_feat" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sp_trust" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_hl_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_feat_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sp_trust_v" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "sp_hl" CASCADE;
  DROP TABLE "sp_feat" CASCADE;
  DROP TABLE "sp_trust" CASCADE;
  DROP TABLE "_sp_hl_v" CASCADE;
  DROP TABLE "_sp_feat_v" CASCADE;
  DROP TABLE "_sp_trust_v" CASCADE;`);
}
