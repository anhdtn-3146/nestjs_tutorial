import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUserArticleRelation1772166332788 implements MigrationInterface {
    name = 'FixUserArticleRelation1772166332788'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_1ed335365d488f980e6b8bbe1ee"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "articlesId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "articlesId" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_1ed335365d488f980e6b8bbe1ee" FOREIGN KEY ("articlesId") REFERENCES "articles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
