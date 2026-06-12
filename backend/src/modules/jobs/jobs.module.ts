import { Module } from "@nestjs/common";
import { JobsController } from "./jobs.controller";
import { JobsService } from "./jobs.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Job } from "./entities/job.entity";
import { JobModelAction } from "./actions/job.action";
import { SchedulerModule } from "../workers/scheduler/scheduler.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    SchedulerModule,
],
  controllers: [JobsController],
  providers: [JobsService, JobModelAction],
})
export class JobsModule {}