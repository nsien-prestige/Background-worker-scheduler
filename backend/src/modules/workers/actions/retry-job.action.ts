import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { JobStatus } from '../../jobs/enums/job-status.enum';
import { AbstractModelAction } from '../../../database/abstract.action';

@Injectable()
export class RetryJobAction extends AbstractModelAction<Job> {
  constructor(
    @InjectRepository(Job)
    repository: Repository<Job>,
  ) {
    super(repository);
  }

  /** Schedules a job for retry with new scheduled_at */
  async scheduleRetry(
    id: string,
    retryCount: number,
    errorMessage: string,
    retryAt: Date,
  ): Promise<void> {
    await this.repository.update(id, {
      status: JobStatus.PENDING,
      retry_count: retryCount,
      error_message: errorMessage,
      scheduled_at: retryAt,
      locked_by: null,
      locked_at: null,
    });
  }

  /** Moves a job to the DLQ */
  async moveToDLQ(
    id: string,
    errorMessage: string,
    maxRetries: number,
  ): Promise<void> {
    await this.repository.update(id, {
      status: JobStatus.FAILED,
      retry_count: maxRetries,
      error_message: errorMessage,
      is_dlq: true,
      dlq_reason: `Exhausted ${maxRetries} retry attempts. Last error: ${errorMessage}`,
      locked_by: null,
      locked_at: null,
    });
  }

  /** Counts jobs currently in DLQ */
  async countDLQ(): Promise<number> {
    return this.repository.count({
      where: { is_dlq: true, status: JobStatus.FAILED },
    });
  }

  /** Finds the retried job after scheduling */
  async findForHeap(id: string): Promise<Job | null> {
    return this.repository.findOne({ where: { id } });
  }
}