import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      IF to_regtype('public.enum_projects_category') IS NOT NULL THEN
        ALTER TYPE "public"."enum_projects_category" ADD VALUE IF NOT EXISTS 'Preclinical Studies';
        ALTER TYPE "public"."enum_projects_category" ADD VALUE IF NOT EXISTS 'Molecular Research';
        ALTER TYPE "public"."enum_projects_category" ADD VALUE IF NOT EXISTS 'Biomedical Data Analysis';
      END IF;
    END $$;
    DO $$ BEGIN
      IF to_regtype('public.enum_projects_project_status') IS NOT NULL THEN
        ALTER TYPE "public"."enum_projects_project_status" ADD VALUE IF NOT EXISTS 'Running';
        ALTER TYPE "public"."enum_projects_project_status" ADD VALUE IF NOT EXISTS 'Completed';
      END IF;
    END $$;
    DO $$ BEGIN
      IF to_regtype('public.enum_projects_status') IS NOT NULL THEN
        ALTER TYPE "public"."enum_projects_status" ADD VALUE IF NOT EXISTS 'draft';
        ALTER TYPE "public"."enum_projects_status" ADD VALUE IF NOT EXISTS 'published';
      END IF;
    END $$;
    DO $$ BEGIN
      IF to_regtype('public.enum__projects_v_version_category') IS NOT NULL THEN
        ALTER TYPE "public"."enum__projects_v_version_category" ADD VALUE IF NOT EXISTS 'Preclinical Studies';
        ALTER TYPE "public"."enum__projects_v_version_category" ADD VALUE IF NOT EXISTS 'Molecular Research';
        ALTER TYPE "public"."enum__projects_v_version_category" ADD VALUE IF NOT EXISTS 'Biomedical Data Analysis';
      END IF;
    END $$;
    DO $$ BEGIN
      IF to_regtype('public.enum__projects_v_version_project_status') IS NOT NULL THEN
        ALTER TYPE "public"."enum__projects_v_version_project_status" ADD VALUE IF NOT EXISTS 'Running';
        ALTER TYPE "public"."enum__projects_v_version_project_status" ADD VALUE IF NOT EXISTS 'Completed';
      END IF;
    END $$;
    DO $$ BEGIN
      IF to_regtype('public.enum__projects_v_version_status') IS NOT NULL THEN
        ALTER TYPE "public"."enum__projects_v_version_status" ADD VALUE IF NOT EXISTS 'draft';
        ALTER TYPE "public"."enum__projects_v_version_status" ADD VALUE IF NOT EXISTS 'published';
      END IF;
    END $$;
  `);
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // PostgreSQL enum values are intentionally left in place; removing values is unsafe.
}
