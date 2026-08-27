import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1770720478160 implements MigrationInterface {
  name = 'CreateUsers1770720478160';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "full_name" character varying(255) NOT NULL, "phone" character varying(20), "role" character varying(20) NOT NULL DEFAULT 'user', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "auth_sessions" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "refresh_token_hash" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "expires_at" TIMESTAMP NOT NULL, "revoked_at" TIMESTAMP, CONSTRAINT "UQ_auth_sessions_refresh_token_hash" UNIQUE ("refresh_token_hash"), CONSTRAINT "PK_auth_sessions" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_auth_sessions_user_id" ON "auth_sessions" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_auth_sessions_expires_at" ON "auth_sessions" ("expires_at")`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" ADD CONSTRAINT "FK_auth_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_auth_sessions_user"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_auth_sessions_expires_at"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_auth_sessions_user_id"`);
    await queryRunner.query(`DROP TABLE "auth_sessions"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
