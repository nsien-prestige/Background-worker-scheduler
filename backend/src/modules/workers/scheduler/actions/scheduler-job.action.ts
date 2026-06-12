import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import { Job } from '../../../jobs/entities/job.entity';
import { JobStatus } from '../../../jobs/enums/job-status.enum';
import { AbstractModelAction } from '../../../../database/abstract.action';

@Injectable()
export class SchedulerJobAction extends AbstractModelAction<Job> {
  constructor(
    @InjectRepository(Job)
    repository: Repository<Job>,
  ) {
    super(repository);
  }

  /** Loads all pending due jobs for heap initialization */
  async loadPendingJobs(): Promise<Job[]> {
    return this.repository.find({
      where: [
        { status: JobStatus.PENDING, scheduled_at: IsNull() },
        {
          status: JobStatus.PENDING,
          scheduled_at: LessThanOrEqual(new Date()),
        },
      ],
    });
  }

  /** Finds jobs that are now due */
  async findDueJobs(): Promise<Job[]> {
    return this.repository.find({
      where: {
        status: JobStatus.PENDING,
        scheduled_at: LessThanOrEqual(new Date()),
      },
    });
  }

  /** Finds pending jobs with no scheduled_at for aging */
  async findPendingUnscheduled(): Promise<Job[]> {
    return this.repository.find({
      where: {
        status: JobStatus.PENDING,
        scheduled_at: IsNull(),
      },
    });
  }

  async updatePriority(jobId: string, priority: number): Promise<void> {
    await this.repository.update(jobId, { priority });
  }
}