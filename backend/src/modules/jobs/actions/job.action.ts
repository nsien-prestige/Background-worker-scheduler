import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '../../../database/abstract.action';
import { Job } from '../entities/job.entity';
import { JobStatus } from '../enums/job-status.enum';

@Injectable()
export class JobModelAction extends AbstractModelAction<Job> {
  constructor(
    @InjectRepository(Job)
    repository: Repository<Job>,
  ) {
    super(repository);
  }

  /** Atomically cancels a job only if it's not already terminal */
  async cancelIfEligible(id: string): Promise<Job | null> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Job)
      .set({ status: JobStatus.CANCELLED })
      .where('id = :id', { id })
      .andWhere('status NOT IN (:...statuses)', {
        statuses: [JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED],
      })
      .returning('*')
      .execute();

    return result.raw[0] || null;
  }

  /** Atomically retries a job only if it's currently failed */
  async retryIfFailed(id: string): Promise<Job | null> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Job)
      .set({
        status: JobStatus.PENDING,
        retry_count: 0,
        error_message: null,
        started_at: null,
        locked_by: null,
        locked_at: null,
      })
      .where('id = :id', { id })
      .andWhere('status = :status', { status: JobStatus.FAILED })
      .returning('*')
      .execute();

    return result.raw[0] || null;
  }
}