import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserMFA1790056435362 implements MigrationInterface {
  name = 'AddUserMFA1790056435362';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "isMfaEnabled" boolean DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "mfaSecret" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfaSecret"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isMfaEnabled"`);
  }
}
