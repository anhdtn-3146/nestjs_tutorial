import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTourTimeAutoCloseIndex1787587200000 implements MigrationInterface {
  name = 'AddTourTimeAutoCloseIndex1787587200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_tour_times_open_start_date" ON "tour_times" ("start_date") WHERE "status" = 'open' AND "deleted_at" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_tour_times_open_start_date"`,
    );
  }
}
