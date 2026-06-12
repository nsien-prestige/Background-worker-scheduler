import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database.config';
import { JobsModule } from './modules/jobs/jobs.module';
import { SchedulerModule } from './modules/workers/scheduler/scheduler.module';
import { WorkerModule } from './modules/workers/workers.module';

@Module({
  imports: [DatabaseModule, JobsModule, SchedulerModule, WorkerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
