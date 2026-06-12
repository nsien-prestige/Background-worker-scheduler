import { Module } from "@nestjs/common";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Job } from "./entities/job.entity";
import { JobModelAction } from "./actions/job.action";
import { SchedulerModule } from "../workers/scheduler/scheduler.module";
import { DagService } from "./dag.service";
import { JobDependency } from "./entities/job-dependency.entity";
import { DagJobAction } from "./actions/dag-job.action";

@Module({
  imports: [
    TypeOrmModule.forFeature([Job, JobDependency]),
    SchedulerModule,
],
  controllers: [JobsController],
  providers: [JobsService, JobModelAction, DagService, DagJobAction],
  exports: [DagService],
})
export class JobsModule {}