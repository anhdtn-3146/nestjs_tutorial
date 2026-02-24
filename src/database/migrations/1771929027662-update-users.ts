import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUsers1771929027662 implements MigrationInterface {
    name = 'UpdateUsers1771929027662'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "following" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "following"`);
    }

}
