import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueConstraintToJobDependencies1781272988255 implements MigrationInterface {
    name = 'AddUniqueConstraintToJobDependencies1781272988255'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove duplicate dependencies keeping only the first one
        await queryRunner.query(`
            DELETE FROM "job_dependencies"
            WHERE id NOT IN (
                SELECT DISTINCT ON (job_id, depends_on_id) id
                FROM "job_dependencies"
                ORDER BY job_id, depends_on_id, created_at ASC
            )
        `);
        await queryRunner.query(`ALTER TABLE "job_dependencies" ADD CONSTRAINT "UQ_b59228391ede25b7bc564886809" UNIQUE ("job_id", "depends_on_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_dependencies" DROP CONSTRAINT "UQ_b59228391ede25b7bc564886809"`);
    }

}
