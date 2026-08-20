import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateBookingStatuses1787126400000 implements MigrationInterface {
  name = 'UpdateBookingStatuses1787126400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "CHK_bookings_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "bookings_status_check"`,
    );
    await queryRunner.query(
      `UPDATE "bookings" SET "status" = 'approved' WHERE "status" = 'confirmed'`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "status" TYPE character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "status" SET DEFAULT 'pending'`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ALTER COLUMN "status" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "CHK_bookings_status" CHECK ("status" IN ('pending', 'approved', 'rejected', 'cancelled'))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "CHK_bookings_status"`,
    );
    await queryRunner.query(
      `UPDATE "bookings" SET "status" = 'confirmed' WHERE "status" = 'approved'`,
    );
    await queryRunner.query(
      `UPDATE "bookings" SET "status" = 'cancelled' WHERE "status" = 'rejected'`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "CHK_bookings_status" CHECK ("status" IN ('pending', 'confirmed', 'cancelled'))`,
    );
  }
}
