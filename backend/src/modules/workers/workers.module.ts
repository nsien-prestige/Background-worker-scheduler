import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkerService } from './workers.service';
import { EmailHandler } from './handlers/email.handler';
import { Job } from '../jobs/entities/job.entity';
import { SchedulerModule } from './scheduler/scheduler.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    SchedulerModule,
  ],
  providers: [WorkerService, EmailHandler],
})
export class WorkerModule {}