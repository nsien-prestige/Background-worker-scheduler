import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateJobsPriorityDefault1781217386855 implements MigrationInterface {
    name = 'UpdateJobsPriorityDefault1781217386855'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "priority" SET DEFAULT '3'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "jobs" ALTER COLUMN "priority" SET DEFAULT '2'`);
    }

}
