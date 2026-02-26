import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTagAndArticle1772004521690 implements MigrationInterface {
    name = 'CreateTagAndArticle1772004521690'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tags" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "articles" ("id" SERIAL NOT NULL, "slug" character varying NOT NULL, "title" character varying NOT NULL, "description" character varying NOT NULL, "body" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "authorId" integer, CONSTRAINT "UQ_1123ff6815c5b8fec0ba9fec370" UNIQUE ("slug"), CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "articles_tag_list_tags" ("articlesId" integer NOT NULL, "tagsId" integer NOT NULL, CONSTRAINT "PK_a31848c989810ae15df2a000259" PRIMARY KEY ("articlesId", "tagsId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_77fbcba9604a1725f5ac5f5aac" ON "articles_tag_list_tags" ("articlesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_92bf241babb02aca4f6a7e2d8c" ON "articles_tag_list_tags" ("tagsId") `);
        await queryRunner.query(`CREATE TABLE "articles_favorited_by_users" ("articlesId" integer NOT NULL, "usersId" integer NOT NULL, CONSTRAINT "PK_36a2163f84702d7cab7899c3a64" PRIMARY KEY ("articlesId", "usersId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a4edf351aa152ef0143a6d22c5" ON "articles_favorited_by_users" ("articlesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_be5e80e58412ae12f710f85678" ON "articles_favorited_by_users" ("usersId") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "articlesId" integer`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_1ed335365d488f980e6b8bbe1ee" FOREIGN KEY ("articlesId") REFERENCES "articles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "articles_tag_list_tags" ADD CONSTRAINT "FK_77fbcba9604a1725f5ac5f5aaca" FOREIGN KEY ("articlesId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "articles_tag_list_tags" ADD CONSTRAINT "FK_92bf241babb02aca4f6a7e2d8cd" FOREIGN KEY ("tagsId") REFERENCES "tags"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "articles_favorited_by_users" ADD CONSTRAINT "FK_a4edf351aa152ef0143a6d22c5b" FOREIGN KEY ("articlesId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "articles_favorited_by_users" ADD CONSTRAINT "FK_be5e80e58412ae12f710f856782" FOREIGN KEY ("usersId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "articles_favorited_by_users" DROP CONSTRAINT "FK_be5e80e58412ae12f710f856782"`);
        await queryRunner.query(`ALTER TABLE "articles_favorited_by_users" DROP CONSTRAINT "FK_a4edf351aa152ef0143a6d22c5b"`);
        await queryRunner.query(`ALTER TABLE "articles_tag_list_tags" DROP CONSTRAINT "FK_92bf241babb02aca4f6a7e2d8cd"`);
        await queryRunner.query(`ALTER TABLE "articles_tag_list_tags" DROP CONSTRAINT "FK_77fbcba9604a1725f5ac5f5aaca"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_1ed335365d488f980e6b8bbe1ee"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "articlesId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_be5e80e58412ae12f710f85678"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a4edf351aa152ef0143a6d22c5"`);
        await queryRunner.query(`DROP TABLE "articles_favorited_by_users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_92bf241babb02aca4f6a7e2d8c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77fbcba9604a1725f5ac5f5aac"`);
        await queryRunner.query(`DROP TABLE "articles_tag_list_tags"`);
        await queryRunner.query(`DROP TABLE "articles"`);
        await queryRunner.query(`DROP TABLE "tags"`);
    }

}
