import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTourTimeSoftDelete1787041000000 implements MigrationInterface {
  name = 'AddTourTimeSoftDelete1787041000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "tour_times" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tour_times_tour_deleted_at" ON "tour_times" ("tour_id", "deleted_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_tour_times_tour_deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_times" DROP COLUMN "deleted_at"`,
    );
  }
}
