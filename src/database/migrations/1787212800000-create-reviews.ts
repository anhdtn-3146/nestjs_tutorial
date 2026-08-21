import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviews1787212800000 implements MigrationInterface {
  name = 'CreateReviews1787212800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "tour_id" integer NOT NULL, "rating" integer NOT NULL, "comment" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_reviews_rating" CHECK ("rating" BETWEEN 1 AND 5), CONSTRAINT "PK_reviews" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_user_id" ON "reviews" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_reviews_tour_id" ON "reviews" ("tour_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_tour" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "reviews"`);
  }
}
