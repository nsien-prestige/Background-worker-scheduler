import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AbstractModelAction } from '../../../database/abstract.action';
import { Job } from '../entities/job.entity';
import { JobStatus } from '../enums/job-status.enum';
import { JobStats } from '../interfaces/job-stats.interface';

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
        is_dlq: false,
        dlq_reason: null,
      })
      .where('id = :id', { id })
      .andWhere('status = :status', { status: JobStatus.FAILED })
      .returning('*')
      .execute();

    return result.raw[0] || null;
  }

  async findDLQ(): Promise<Job[]> {
    return this.repository.find({
      where: { is_dlq: true, status: JobStatus.FAILED },
      order: { updated_at: 'DESC' },
    });
  }

  async findAllPaginated(
    page: number,
    limit: number,
  ): Promise<{ data: Job[]; total: number }> {
    return this.findPaginated(page, limit, { order: { created_at: 'DESC' } });
  }

  async findDLQPaginated(
    page: number,
    limit: number,
  ): Promise<{ data: Job[]; total: number }> {
    return this.findPaginated(page, limit, {
      where: { is_dlq: true, status: JobStatus.FAILED },
      order: { updated_at: 'DESC' },
    });
  }

  async getStats(): Promise<JobStats> {
    const rows = await this.repository
      .createQueryBuilder('job')
      .select('job.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('job.status')
      .getRawMany<{ status: JobStatus; count: string }>();

    const stats: JobStats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
      total: 0,
    };

    rows.forEach(({ status, count }) => {
      const value = Number(count);
      stats[status] = value;
      stats.total += value;
    });

    return stats;
  }
}
