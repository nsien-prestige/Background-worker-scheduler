import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './config/database.config';
import { JobsModule } from './modules/jobs/jobs.module';

@Module({
  imports: [DatabaseModule, JobsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
