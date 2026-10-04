import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductCheckoutEnabled1790600400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "customFieldsCheckoutenabled" boolean NOT NULL DEFAULT true`,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product" DROP COLUMN IF EXISTS "customFieldsCheckoutenabled"`,
      undefined,
    );
  }
}
