import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTourTimeConstraints1787040000000 implements MigrationInterface {
  name = 'AddTourTimeConstraints1787040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tour_times" ADD CONSTRAINT "CHK_tour_times_date_range" CHECK ("end_date" >= "start_date")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_times" ADD CONSTRAINT "CHK_tour_times_price" CHECK ("price" >= 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_times" ADD CONSTRAINT "CHK_tour_times_capacity" CHECK ("max_capacity" > 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_times" ADD CONSTRAINT "CHK_tour_times_status" CHECK ("status" IN ('open', 'closed', 'cancelled'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_tour_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_tour_time" FOREIGN KEY ("tour_time_id") REFERENCES "tour_times"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_bookings_tour_time"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_tour_time" FOREIGN KEY ("tour_time_id") REFERENCES "tour_times"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_times" DROP CONSTRAINT "CHK_tour_times_status"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_times" DROP CONSTRAINT "CHK_tour_times_capacity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_times" DROP CONSTRAINT "CHK_tour_times_price"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_times" DROP CONSTRAINT "CHK_tour_times_date_range"`,
    );
  }
}
