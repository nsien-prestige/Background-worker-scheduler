import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import {
  AddDependencyDocs,
  CancelJobDocs,
  CreateJobDocs,
  FindAllJobsDocs,
  FindDLQDocs,
  GetJobStatsDocs,
  JobsDocs,
  RetryJobDocs,
  RunBenchmarkDocs,
} from './docs/jobs.docs';

@JobsDocs()
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateJobDocs()
  createJob(@Body() dto: CreateJobDto) {
    return this.jobsService.createJob(dto);
  }

  @Get()
  @FindAllJobsDocs()
  findAll(@Query() pagination: PaginationDto) {
    return this.jobsService.findAll(
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  @Get('stats')
  @GetJobStatsDocs()
  getStats() {
    return this.jobsService.getStats();
  }

  @Get('dlq')
  @FindDLQDocs()
  findDLQ(@Query() pagination: PaginationDto) {
    return this.jobsService.findDLQ(
      pagination.page ?? 1,
      pagination.limit ?? 20,
    );
  }

  @Patch(':id/cancel')
  @CancelJobDocs()
  cancelJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.cancelJob(id);
  }

  @Post(':id/retry')
  @RetryJobDocs()
  retryJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.retryJob(id);
  }

  @Post(':jobId/dependencies/:dependsOnId')
  @AddDependencyDocs()
  addDependency(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @Param('dependsOnId', ParseUUIDPipe) dependsOnId: string,
  ) {
    return this.jobsService.addDependency(jobId, dependsOnId);
  }

  @Get('benchmark')
  @RunBenchmarkDocs()
  runBenchmark(@Query('jobs') jobCount?: string) {
    const count = jobCount ? parseInt(jobCount) : 10000;
    return this.jobsService.runBenchmark(count);
  }
}
