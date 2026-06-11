import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateJobsTable1781200645988 implements MigrationInterface {
    name = 'CreateJobsTable1781200645988'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "public"."jobs_status_enum" AS ENUM('pending', 'processing', 'completed', 'failed', 'cancelled');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "payload" jsonb NOT NULL, "priority" integer NOT NULL DEFAULT '2', "status" "public"."jobs_status_enum" NOT NULL DEFAULT 'pending', "retry_count" integer NOT NULL DEFAULT '0', "error_message" text, "scheduled_at" TIMESTAMP WITH TIME ZONE, "recurring_interval" character varying, "locked_by" character varying, "locked_at" TIMESTAMP WITH TIME ZONE, "started_at" TIMESTAMP WITH TIME ZONE, "completed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "jobs"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_status_enum"`);
    }

}
