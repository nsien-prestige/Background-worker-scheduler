import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDLQColumnsToJobs1781261511283 implements MigrationInterface {
    name = 'AddDLQColumnsToJobs1781261511283'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" ADD "is_dlq" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "dlq_reason" text`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD "dlq_retry_count" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "dlq_retry_count"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "dlq_reason"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP COLUMN "is_dlq"`);
    }

}
