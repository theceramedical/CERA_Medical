import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE IF EXISTS "public"."enum_projects_category" ADD VALUE IF NOT EXISTS 'Preclinical Studies';
    ALTER TYPE IF EXISTS "public"."enum_projects_category" ADD VALUE IF NOT EXISTS 'Molecular Research';
    ALTER TYPE IF EXISTS "public"."enum_projects_category" ADD VALUE IF NOT EXISTS 'Biomedical Data Analysis';
    ALTER TYPE IF EXISTS "public"."enum_projects_project_status" ADD VALUE IF NOT EXISTS 'Running';
    ALTER TYPE IF EXISTS "public"."enum_projects_project_status" ADD VALUE IF NOT EXISTS 'Completed';
    ALTER TYPE IF EXISTS "public"."enum_projects_status" ADD VALUE IF NOT EXISTS 'draft';
    ALTER TYPE IF EXISTS "public"."enum_projects_status" ADD VALUE IF NOT EXISTS 'published';
    ALTER TYPE IF EXISTS "public"."enum__projects_v_version_category" ADD VALUE IF NOT EXISTS 'Preclinical Studies';
    ALTER TYPE IF EXISTS "public"."enum__projects_v_version_category" ADD VALUE IF NOT EXISTS 'Molecular Research';
    ALTER TYPE IF EXISTS "public"."enum__projects_v_version_category" ADD VALUE IF NOT EXISTS 'Biomedical Data Analysis';
    ALTER TYPE IF EXISTS "public"."enum__projects_v_version_project_status" ADD VALUE IF NOT EXISTS 'Running';
    ALTER TYPE IF EXISTS "public"."enum__projects_v_version_project_status" ADD VALUE IF NOT EXISTS 'Completed';
    ALTER TYPE IF EXISTS "public"."enum__projects_v_version_status" ADD VALUE IF NOT EXISTS 'draft';
    ALTER TYPE IF EXISTS "public"."enum__projects_v_version_status" ADD VALUE IF NOT EXISTS 'published';
  `);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // PostgreSQL enum values are intentionally left in place; removing values is unsafe.
}
