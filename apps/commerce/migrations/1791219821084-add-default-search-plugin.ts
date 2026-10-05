import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultSearchPlugin1791219821084 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(
      `CREATE TABLE "search_index_item" ("languageCode" character varying NOT NULL, "enabled" boolean NOT NULL, "productName" character varying NOT NULL, "productVariantName" character varying NOT NULL, "description" text NOT NULL, "slug" character varying NOT NULL, "sku" character varying NOT NULL, "facetIds" text NOT NULL, "facetValueIds" text NOT NULL, "collectionIds" text NOT NULL, "collectionSlugs" text NOT NULL, "channelIds" text NOT NULL, "productPreview" character varying NOT NULL, "productPreviewFocalPoint" text, "productVariantPreview" character varying NOT NULL, "productVariantPreviewFocalPoint" text, "inStock" boolean NOT NULL DEFAULT true, "productInStock" boolean NOT NULL DEFAULT true, "productVariantId" integer NOT NULL, "channelId" integer NOT NULL, "productId" integer NOT NULL, "productAssetId" integer, "productVariantAssetId" integer, "price" integer NOT NULL, "priceWithTax" integer NOT NULL, CONSTRAINT "PK_6470dd173311562c89e5f80b30e" PRIMARY KEY ("languageCode", "productVariantId", "channelId"))`,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_6fb55742e13e8082954d0436dc" ON "search_index_item" ("productName") `,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_d8791f444a8bf23fe4c1bc020c" ON "search_index_item" ("productVariantName") `,
      undefined,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a5a6a556f75c4ac7bfdd03410" ON "search_index_item" ("description") `,
      undefined,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.query(`DROP INDEX "public"."IDX_9a5a6a556f75c4ac7bfdd03410"`, undefined);
    await queryRunner.query(`DROP INDEX "public"."IDX_d8791f444a8bf23fe4c1bc020c"`, undefined);
    await queryRunner.query(`DROP INDEX "public"."IDX_6fb55742e13e8082954d0436dc"`, undefined);
    await queryRunner.query(`DROP TABLE "search_index_item"`, undefined);
  }
}
