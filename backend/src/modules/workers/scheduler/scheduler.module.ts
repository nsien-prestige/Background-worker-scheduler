import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { Job } from '../../jobs/entities/job.entity';
import { SchedulerJobAction } from './actions/scheduler-job.action';
import { SchedulerBenchmarkService } from './benchmark/scheduler-benchmark.service';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  providers: [SchedulerService, SchedulerJobAction, SchedulerBenchmarkService],
  exports: [SchedulerService, SchedulerBenchmarkService],
})
export class SchedulerModule {}