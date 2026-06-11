import { Injectable } from '@nestjs/common';
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
}