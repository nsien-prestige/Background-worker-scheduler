import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreateJobDto } from '../dto/create-job.dto';
import { PaginatedJobsResponseDto } from '../dto/paginated-jobs-response.dto';
import { Job } from '../entities/job.entity';

export const JobsDocs = () => applyDecorators(ApiTags('Jobs'));

export const CreateJobDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new job' }),
    ApiBody({ type: CreateJobDto }),
    ApiCreatedResponse({ description: 'Job created successfully', type: Job }),
    ApiBadRequestResponse({ description: 'Invalid job payload' }),
  );

export const FindAllJobsDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get all jobs' }),
    ApiQuery({ name: 'page', required: false, example: 1 }),
    ApiQuery({ name: 'limit', required: false, example: 20 }),
    ApiOkResponse({ type: PaginatedJobsResponseDto }),
  );

export const GetJobStatsDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get job totals grouped by status' }),
    ApiOkResponse({
      schema: {
        example: {
          pending: 10,
          processing: 2,
          completed: 1400,
          failed: 8,
          cancelled: 3,
          total: 1423,
        },
      },
    }),
  );

export const FindDLQDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get jobs in the dead letter queue' }),
    ApiQuery({ name: 'page', required: false, example: 1 }),
    ApiQuery({ name: 'limit', required: false, example: 20 }),
    ApiOkResponse({ type: PaginatedJobsResponseDto }),
  );

export const CancelJobDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Cancel a job' }),
    ApiParam({ name: 'id', description: 'Job ID' }),
    ApiOkResponse({ description: 'Job cancelled successfully', type: Job }),
    ApiNotFoundResponse({ description: 'Job not found' }),
    ApiBadRequestResponse({ description: 'Job cannot be cancelled' }),
  );

export const RetryJobDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Retry a failed job' }),
    ApiParam({ name: 'id', description: 'Job ID' }),
    ApiOkResponse({ description: 'Job queued for retry', type: Job }),
    ApiNotFoundResponse({ description: 'Job not found' }),
    ApiBadRequestResponse({ description: 'Job cannot be retried' }),
  );

export const AddDependencyDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Add a job dependency' }),
    ApiParam({ name: 'jobId', description: 'Job ID' }),
    ApiParam({ name: 'dependsOnId', description: 'Dependency job ID' }),
    ApiOkResponse({ description: 'Dependency added successfully' }),
    ApiBadRequestResponse({ description: 'Invalid dependency request' }),
  );

export const RunBenchmarkDocs = () =>
  applyDecorators(
    ApiOperation({ summary: 'Run scheduler benchmark' }),
    ApiQuery({ name: 'jobs', required: false, example: 10000 }),
    ApiOkResponse({ description: 'Benchmark result' }),
  );
