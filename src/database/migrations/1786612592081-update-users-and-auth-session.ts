import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUsersAndAuthSession1786612592081 implements MigrationInterface {
  name = 'UpdateUsersAndAuthSession1786612592081';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_auth_sessions_user_id"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_auth_sessions_expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "full_name" TYPE character varying(255)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "full_name" TYPE character varying`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_expires_at" ON "auth_sessions" ("expires_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_auth_sessions_user_id" ON "auth_sessions" ("user_id")`,
    );
  }
}
