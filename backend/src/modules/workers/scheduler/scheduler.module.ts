import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { Job } from '../../jobs/entities/job.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Job])],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}