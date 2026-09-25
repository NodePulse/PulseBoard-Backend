import { MigrationInterface, QueryRunner } from "typeorm";

export class CashfreeAndBillingCycles1790077085731 implements MigrationInterface {
    name = 'CashfreeAndBillingCycles1790077085731'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" RENAME COLUMN "razorpay_order_id" TO "cashfree_order_id"`);
        await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN "billing_cycle" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "razorpay_payment_id" TO "cashfree_payment_id"`);
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "razorpay_signature" TO "cashfree_signature"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD COLUMN "billing_cycle" character varying DEFAULT 'MONTHLY'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "billing_cycle"`);
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "cashfree_signature" TO "razorpay_signature"`);
        await queryRunner.query(`ALTER TABLE "payments" RENAME COLUMN "cashfree_payment_id" TO "razorpay_payment_id"`);
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "billing_cycle"`);
        await queryRunner.query(`ALTER TABLE "orders" RENAME COLUMN "cashfree_order_id" TO "razorpay_order_id"`);
    }

}
