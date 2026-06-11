import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JobModelAction } from './actions/job.action';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './entities/job.entity';

@Injectable()
export class JobsService {
  constructor(private readonly jobAction: JobModelAction) {}

  /** Creates a new job and queues it for processing */
  async createJob(dto: CreateJobDto): Promise<Job> {
    return this.jobAction.create({
      type: dto.type,
      payload: dto.payload,
      priority: dto.priority,
      scheduled_at: dto.scheduled_at ? new Date(dto.scheduled_at) : null,
      recurring_interval: dto.recurring_interval ?? null,
    });
  }

  /** Retrieves all jobs */
  async findAll(): Promise<Job[]> {
    return this.jobAction.findAll();
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
    return retried;
  }
}