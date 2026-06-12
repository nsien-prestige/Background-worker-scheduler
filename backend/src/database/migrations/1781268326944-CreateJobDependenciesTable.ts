import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateJobDependenciesTable1781268326944 implements MigrationInterface {
    name = 'CreateJobDependenciesTable1781268326944'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "job_dependencies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "job_id" uuid NOT NULL, "depends_on_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_1d435220b97892c66d0e3697ed4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "job_dependencies" ADD CONSTRAINT "FK_fe7ca0123f9e92cf492526c5a12" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_dependencies" ADD CONSTRAINT "FK_7a31d686a69f7a38f9caa509a0e" FOREIGN KEY ("depends_on_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_dependencies" DROP CONSTRAINT "FK_7a31d686a69f7a38f9caa509a0e"`);
        await queryRunner.query(`ALTER TABLE "job_dependencies" DROP CONSTRAINT "FK_fe7ca0123f9e92cf492526c5a12"`);
        await queryRunner.query(`DROP TABLE "job_dependencies"`);
    }

}
