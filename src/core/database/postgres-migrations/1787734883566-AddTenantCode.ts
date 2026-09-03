import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantCode1787734883566 implements MigrationInterface {
  name = 'AddTenantCode1787734883566';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add the column without the NOT NULL constraint
    await queryRunner.query(`ALTER TABLE "tenants" ADD "code" character(9)`);

    // 2. Update existing rows with a generated code (e.g. O + 8 random uppercase hex chars)
    await queryRunner.query(
      `UPDATE "tenants" SET "code" = 'O' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)) WHERE "code" IS NULL`,
    );

    // 3. Make the column NOT NULL
    await queryRunner.query(
      `ALTER TABLE "tenants" ALTER COLUMN "code" SET NOT NULL`,
    );

    // 4. Add the unique constraint
    await queryRunner.query(
      `ALTER TABLE "tenants" ADD CONSTRAINT "UQ_3021c18db2b363ae9324c826c5a" UNIQUE ("code")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tenants" DROP CONSTRAINT "UQ_3021c18db2b363ae9324c826c5a"`,
    );
    await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "code"`);
  }
}
