import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTourBookingSchema1786950631067
  implements MigrationInterface
{
  name = 'CreateTourBookingSchema1786950631067';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "full_name" TYPE character varying(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE character varying(50)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "CHK_users_role" CHECK ("role" IN ('user', 'admin'))`,
    );

    await queryRunner.query(
      `CREATE TABLE "categories" ("id" SERIAL NOT NULL, "name" character varying(255) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_categories_name" UNIQUE ("name"), CONSTRAINT "PK_categories" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tours" ("id" SERIAL NOT NULL, "category_id" integer, "title" character varying(255) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tours" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tours_category_id" ON "tours" ("category_id")`,
    );
    await queryRunner.query(
      `CREATE TABLE "tour_images" ("id" SERIAL NOT NULL, "tour_id" integer NOT NULL, "image_url" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "sort_order" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_tour_images" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tour_images_tour_id" ON "tour_images" ("tour_id")`,
    );
    await queryRunner.query(
      `CREATE TABLE "tour_times" ("id" SERIAL NOT NULL, "tour_id" integer NOT NULL, "start_date" date NOT NULL, "end_date" date NOT NULL, "price" numeric(12,2) NOT NULL, "max_capacity" integer NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'open', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_tour_times" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tour_times_tour_id" ON "tour_times" ("tour_id")`,
    );
    await queryRunner.query(
      `CREATE TABLE "bookings" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "tour_time_id" integer NOT NULL, "number_of_slots" integer NOT NULL DEFAULT 1, "status" character varying(20) NOT NULL DEFAULT 'pending', "total_price" numeric(12,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_bookings" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bookings_user_id" ON "bookings" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bookings_tour_time_id" ON "bookings" ("tour_time_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tours" ADD CONSTRAINT "FK_tours_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_images" ADD CONSTRAINT "FK_tour_images_tour" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tour_times" ADD CONSTRAINT "FK_tour_times_tour" FOREIGN KEY ("tour_id") REFERENCES "tours"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_bookings_tour_time" FOREIGN KEY ("tour_time_id") REFERENCES "tour_times"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bookings"`);
    await queryRunner.query(`DROP TABLE "tour_times"`);
    await queryRunner.query(`DROP TABLE "tour_images"`);
    await queryRunner.query(`DROP TABLE "tours"`);
    await queryRunner.query(`DROP TABLE "categories"`);

    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "CHK_users_role"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE character varying(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "full_name" TYPE character varying`,
    );
  }
}
