import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerService } from './workers.service';
import { EmailHandler } from './handlers/email.handler';
import { Job } from '../jobs/entities/job.entity';
import { SchedulerModule } from './scheduler/scheduler.module';
import { RetryService } from './retry.service';
import { RetryJobAction } from './actions/retry-job.action';
import { WorkerJobAction } from './actions/worker-job.action';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    SchedulerModule,
  ],
  providers: [
    WorkerService, 
    RetryService, 
    EmailHandler,
    WorkerJobAction,
    RetryJobAction,
],
})
export class WorkerModule {}