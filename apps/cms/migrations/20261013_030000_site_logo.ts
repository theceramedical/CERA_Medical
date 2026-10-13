import { sql } from '@payloadcms/db-postgres';

import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" ADD COLUMN "logo_id" integer;
    ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_id_media_id_fk"
      FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null;
    CREATE INDEX "site_settings_logo_idx" ON "site_settings" USING btree ("logo_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "site_settings" DROP COLUMN "logo_id";`);
}
