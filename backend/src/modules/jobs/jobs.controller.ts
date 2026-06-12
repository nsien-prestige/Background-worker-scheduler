import { Controller, Get, Post, Body, HttpCode, HttpStatus, Patch, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
    createJob(@Body() dto: CreateJobDto) {
      return this.jobsService.createJob(dto);
    }

  @Get()
    findAll() {
      return this.jobsService.findAll();
    }

  @Get('dlq')
    findDLQ() {
      return this.jobsService.findDLQ();
    }

  @Patch(':id/cancel')
    cancelJob(@Param('id', ParseUUIDPipe) id: string) {
      return this.jobsService.cancelJob(id);
    }

  @Post(':id/retry')
    retryJob(@Param('id', ParseUUIDPipe) id: string) {
      return this.jobsService.retryJob(id);
    }

  @Post(':jobId/dependencies/:dependsOnId')
    addDependency(
      @Param('jobId', ParseUUIDPipe) jobId: string,
      @Param('dependsOnId', ParseUUIDPipe) dependsOnId: string,
    ) {
      return this.jobsService.addDependency(jobId, dependsOnId);
    }

  @Get('benchmark')
    runBenchmark(@Query('jobs') jobCount?: string) {
      const count = jobCount ? parseInt(jobCount) : 10000;
      return this.jobsService.runBenchmark(count);
    }
}