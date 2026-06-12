import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { JobStatus } from '../../jobs/enums/job-status.enum';
import { AbstractModelAction } from '../../../database/abstract.action';

const WORKER_ID = `worker-${process.pid}`;

@Injectable()
export class WorkerJobAction extends AbstractModelAction<Job> {
  constructor(
    @InjectRepository(Job)
    repository: Repository<Job>,
  ) {
    super(repository);
  }

  /** Atomically locks a job for processing */
  async lockJob(id: string): Promise<Job | null> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Job)
      .set({
        status: JobStatus.PROCESSING,
        locked_by: WORKER_ID,
        locked_at: new Date(),
        started_at: new Date(),
      })
      .where('id = :id', { id })
      .andWhere('status = :status', { status: JobStatus.PENDING })
      .returning('*')
      .execute();

    return result.raw[0] || null;
  }

  /** Marks a job as completed */
  async completeJob(id: string): Promise<void> {
    await this.repository.update(id, {
      status: JobStatus.COMPLETED,
      completed_at: new Date(),
      locked_by: null,
      locked_at: null,
    });
  }

  /** Creates the next recurrence of a recurring job */
  async createRecurringJob(job: Job, nextRun: Date): Promise<Job> {
    return this.repository.save(
      this.repository.create({
        type: job.type,
        payload: job.payload,
        priority: job.priority,
        scheduled_at: nextRun,
        recurring_interval: job.recurring_interval,
      }),
    );
  }

  /** Resets stale locked jobs back to pending */
  async resetStaleJobs(staleTime: Date): Promise<Job[]> {
    const result = await this.repository
      .createQueryBuilder()
      .update(Job)
      .set({
        status: JobStatus.PENDING,
        locked_by: null,
        locked_at: null,
        started_at: null,
      })
      .where('status = :status', { status: JobStatus.PROCESSING })
      .andWhere('locked_at < :staleTime', { staleTime })
      .returning('*')
      .execute();

    return result.raw as Job[];
  }
}