import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRole1784703493764 implements MigrationInterface {
    name = 'AddUserRole1784703493764'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_userrole_enum" AS ENUM('admin', 'user')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "userRole" "public"."users_userrole_enum" NOT NULL DEFAULT 'user'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isActive" boolean DEFAULT true`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "userRole"`);
        await queryRunner.query(`DROP TYPE "public"."users_userrole_enum"`);
    }

}
