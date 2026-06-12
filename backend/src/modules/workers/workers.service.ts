import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { JobStatus } from '../jobs/enums/job-status.enum';
import { SchedulerService } from './scheduler/scheduler.service';
import { EmailHandler } from './handlers/email.handler';
import { RetryService } from './retry.service';

const POLL_INTERVAL_MS = 5000;
const LOCK_TIMEOUT_MINUTES = 5;
const WORKER_ID = `worker-${process.pid}`;

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private pollingInterval?: NodeJS.Timeout;
  private watchdogInterval?: NodeJS.Timeout;

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly schedulerService: SchedulerService,
    private readonly emailHandler: EmailHandler,
    private readonly retryService: RetryService,
  ) {}

  onModuleInit(): void {
    this.startPolling();
    this.startWatchdog();
  }

  onModuleDestroy(): void {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.watchdogInterval) clearInterval(this.watchdogInterval);
  }

  private startPolling(): void {
    this.pollingInterval = setInterval(async () => {
      await this.processNextJob();
    }, POLL_INTERVAL_MS);
  }

  private startWatchdog(): void {
    this.watchdogInterval = setInterval(async () => {
      await this.resetStaleJobs();
    }, 60_000);
  }

  private async processNextJob(): Promise<void> {
    const next = this.schedulerService.getNextJob();
    if (!next) return;

    const locked = await this.lockJob(next.id);
    if (!locked) return;

    this.logger.log(`Processing job ${locked.id} type=${locked.type}`);

    try {
      await this.runHandler(locked);
      await this.completeJob(locked.id);
      this.logger.log(`Job ${locked.id} completed`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Job ${locked.id} failed: ${message}`);
      await this.retryService.handleFailure(locked, message);
    }
  }

  private async lockJob(id: string): Promise<Job | null> {
    const result = await this.jobRepository
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

  private async completeJob(id: string): Promise<void> {
    await this.jobRepository.update(id, {
      status: JobStatus.COMPLETED,
      completed_at: new Date(),
      locked_by: null,
      locked_at: null,
    });
  }

  private async resetStaleJobs(): Promise<void> {
    const staleTime = new Date(
      Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000,
    );

    const result = await this.jobRepository
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

    if (result.affected && result.affected > 0) {
      this.logger.warn(`Reset ${result.affected} stale jobs back to pending`);
      const resetJobs = result.raw as Job[];
      for (const job of resetJobs) {
        this.schedulerService.addJob(job);
      }
    }
  }

  private async runHandler(job: Job): Promise<void> {
    switch (job.type) {
      case 'send_email':
        await this.emailHandler.handle(job);
        break;
      default:
        throw new Error(`No handler registered for job type: ${job.type}`);
    }
  }
}