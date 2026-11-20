import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1763640000000 implements MigrationInterface {
  name = 'InitialSchema1763640000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "movies" (
        "id" SERIAL NOT NULL,
        "title" character varying(200) NOT NULL,
        "release_year" integer NOT NULL,
        "runtime_minutes" integer NOT NULL,
        "watched" boolean NOT NULL DEFAULT false,
        CONSTRAINT "PK_movies_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_movies_title" UNIQUE ("title"),
        CONSTRAINT "CHK_movies_runtime"
          CHECK ("runtime_minutes" >= 1 AND "runtime_minutes" <= 300)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "movie_prerequisites" (
        "movie_id" integer NOT NULL,
        "prerequisite_id" integer NOT NULL,
        CONSTRAINT "PK_movie_prerequisites" PRIMARY KEY ("movie_id", "prerequisite_id"),
        CONSTRAINT "CHK_no_self_prerequisite" CHECK ("movie_id" <> "prerequisite_id"),
        CONSTRAINT "FK_movie_prerequisites_movie" FOREIGN KEY ("movie_id")
          REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_movie_prerequisites_prerequisite" FOREIGN KEY ("prerequisite_id")
          REFERENCES "movies"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_movie_prerequisites_prerequisite" ON "movie_prerequisites" ("prerequisite_id")`,
    );

    await queryRunner.query(`
      CREATE TABLE "cinemas" (
        "id" SERIAL NOT NULL,
        "name" character varying(150) NOT NULL,
        CONSTRAINT "PK_cinemas_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cinemas_name" UNIQUE ("name")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "cinema_bundles" (
        "id" SERIAL NOT NULL,
        "size" integer NOT NULL,
        "cinema_id" integer NOT NULL,
        CONSTRAINT "PK_cinema_bundles_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_cinema_bundle_size" UNIQUE ("cinema_id", "size"),
        CONSTRAINT "CHK_cinema_bundle_size" CHECK ("size" >= 1 AND "size" <= 500),
        CONSTRAINT "FK_cinema_bundles_cinema" FOREIGN KEY ("cinema_id")
          REFERENCES "cinemas"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cinema_bundles"`);
    await queryRunner.query(`DROP TABLE "cinemas"`);
    await queryRunner.query(`DROP INDEX "IDX_movie_prerequisites_prerequisite"`);
    await queryRunner.query(`DROP TABLE "movie_prerequisites"`);
    await queryRunner.query(`DROP TABLE "movies"`);
  }
}