import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JobModelAction } from './actions/job.action';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './entities/job.entity';
import { SchedulerService } from '../workers/scheduler/scheduler.service';
import { DagService } from './dag.service';
import { SchedulerBenchmarkService } from '../workers/scheduler/benchmark/scheduler-benchmark.service';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';

@Injectable()
export class JobsService {
  constructor(
    private readonly jobAction: JobModelAction,
    private readonly schedulerService: SchedulerService,
    private readonly dagService: DagService,
    private readonly benchmarkService: SchedulerBenchmarkService,
  ) {}

  /** Creates a new job and adds it to the heap */
  async createJob(dto: CreateJobDto): Promise<Job> {
    const job = await this.jobAction.create({
      type: dto.type,
      payload: dto.payload,
      priority: dto.priority,
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : null,
      recurring_interval: dto.recurring_interval ?? null,
    });

    this.schedulerService.addJob(job);
    return job;
  }

  /** Retrieves all jobs with pagination */
  async findAll(page: number, limit: number): Promise<PaginatedResult<Job>> {
    const { data, total } = await this.jobAction.findAllPaginated(page, limit);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /** Atomically cancels a job if eligible */
  async cancelJob(id: string): Promise<Job> {
    const cancelled = await this.jobAction.cancelIfEligible(id);
    if (!cancelled) {
      const job = await this.jobAction.findById(id);
      if (!job) {
        throw new NotFoundException(`Job ${id} not found`);
      }
      throw new BadRequestException(
        `Job cannot be cancelled — current status is ${job.status}`,
      );
    }
    this.schedulerService.removeJob(id);
    return cancelled;
  }

  /** Atomically retries a failed job from the DLQ */
  async retryJob(id: string): Promise<Job> {
    const retried = await this.jobAction.retryIfFailed(id);
    if (!retried) {
      const job = await this.jobAction.findById(id);
      if (!job) {
        throw new NotFoundException(`Job ${id} not found`);
      }
      throw new BadRequestException(
        `Job cannot be retried — current status is ${job.status}`,
      );
    }
    this.schedulerService.addJob(retried);
    return retried;
  }

  /** Retrieves all jobs in the DLQ with pagination */
  async findDLQ(page: number, limit: number): Promise<PaginatedResult<Job>> {
    const { data, total } = await this.jobAction.findDLQPaginated(page, limit);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async addDependency(jobId: string, dependsOnId: string): Promise<void> {
    await this.dagService.addDependency(jobId, dependsOnId);
  }

  runBenchmark(jobCount: number) {
    return this.benchmarkService.runBenchmark(jobCount);
  }
}
