import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1779943924196 implements MigrationInterface {
  name = 'InitSchema1779943924196';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "analyses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workerType" character varying NOT NULL, "filePath" character varying, "lineNumber" integer, "severity" character varying, "category" character varying, "explanation" text, "fixSuggestion" text, "githubCommentId" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "pullRequestId" uuid, CONSTRAINT "PK_91421900ca225ed9865d016a940" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "analysis_jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "workerType" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'queued', "bullJobId" character varying, "errorMessage" text, "retryCount" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "pullRequestId" uuid, CONSTRAINT "PK_ed5ebf2c133df30c3fb2f633836" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pull_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "prNumber" integer NOT NULL, "title" character varying, "headSha" character varying NOT NULL, "baseBranch" character varying, "authorUsername" character varying, "qualityScore" integer, "status" character varying NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "workspaceId" uuid, CONSTRAINT "PK_e8a8aa8710c3a9650a19a9c2e7b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "workspaces" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "repoFullName" character varying NOT NULL, "githubRepoId" integer, "ownerGithubUsername" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f9a633f9007e0b94587348a58a3" UNIQUE ("repoFullName"), CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "analyses" ADD CONSTRAINT "FK_cdc7a9a775cf8bf786fd0ed6ad1" FOREIGN KEY ("pullRequestId") REFERENCES "pull_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "analysis_jobs" ADD CONSTRAINT "FK_41e796cd334736bd4a74f02afea" FOREIGN KEY ("pullRequestId") REFERENCES "pull_requests"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pull_requests" ADD CONSTRAINT "FK_a5f00391631858b85a5ff7f1a4d" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "pull_requests" DROP CONSTRAINT "FK_a5f00391631858b85a5ff7f1a4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "analysis_jobs" DROP CONSTRAINT "FK_41e796cd334736bd4a74f02afea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "analyses" DROP CONSTRAINT "FK_cdc7a9a775cf8bf786fd0ed6ad1"`,
    );
    await queryRunner.query(`DROP TABLE "workspaces"`);
    await queryRunner.query(`DROP TABLE "pull_requests"`);
    await queryRunner.query(`DROP TABLE "analysis_jobs"`);
    await queryRunner.query(`DROP TABLE "analyses"`);
  }
}
