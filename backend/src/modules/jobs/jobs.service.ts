import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { JobModelAction } from './actions/job.action';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './entities/job.entity';
import { JobStatus } from './enums/job-status.enum';

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

  /** Cancels a job — valid for pending and processing jobs only */
  async cancelJob(id: string): Promise<Job> {
    const job = await this.jobAction.findById(id);
    if (!job) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    const nonCancellableStatuses = [
      JobStatus.COMPLETED,
      JobStatus.FAILED,
      JobStatus.CANCELLED,
    ];
    if (nonCancellableStatuses.includes(job.status)) {
      throw new BadRequestException(
        `Job cannot be cancelled — current status is ${job.status}`,
      );
    }

    const updatedJob = await this.jobAction.update(id, {
      status: JobStatus.CANCELLED,
    });
    if (!updatedJob) {
      throw new NotFoundException(`Job ${id} not found`);
    }

    return updatedJob;
  }
}