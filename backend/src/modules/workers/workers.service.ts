import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Job } from '../jobs/entities/job.entity';
import { SchedulerService } from './scheduler/scheduler.service';
import { EmailHandler } from './handlers/email.handler';
import { RetryService } from './retry.service';
import { WorkerJobAction } from './actions/worker-job.action';

const POLL_INTERVAL_MS = 5000;
const LOCK_TIMEOUT_MINUTES = 5;

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerService.name);
  private pollingInterval?: NodeJS.Timeout;
  private watchdogInterval?: NodeJS.Timeout;

  constructor(
    private readonly workerJobAction: WorkerJobAction,
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

    const locked = await this.workerJobAction.lockJob(next.id);
    if (!locked) return;

    this.logger.log(`Processing job ${locked.id} type=${locked.type}`);

    try {
      await this.runHandler(locked);
      await this.completeJob(locked);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Job ${locked.id} failed: ${message}`);
      await this.retryService.handleFailure(locked, message);
    }
  }

  private async completeJob(job: Job): Promise<void> {
    await this.workerJobAction.completeJob(job.id);
    this.logger.log(`Job ${job.id} completed`);

    if (job.recurring_interval) {
      await this.scheduleNextRecurrence(job);
    }
  }

  private async scheduleNextRecurrence(job: Job): Promise<void> {
    const nextRun = this.calculateNextRun(job.recurring_interval!);
    const newJob = await this.workerJobAction.createRecurringJob(job, nextRun);
    this.schedulerService.addJob(newJob);
    this.logger.log(
      `Recurring job ${job.id} completed — next run at ${nextRun.toISOString()}`,
    );
  }

  private calculateNextRun(interval: string): Date {
    const now = new Date();
    switch (interval) {
      case 'every_1_minute':
        return new Date(now.getTime() + 60_000);
      case 'every_5_minutes':
        return new Date(now.getTime() + 5 * 60_000);
      case 'every_1_hour':
        return new Date(now.getTime() + 60 * 60_000);
      default:
        throw new Error(`Unknown recurring interval: ${interval}`);
    }
  }

  private async resetStaleJobs(): Promise<void> {
    const staleTime = new Date(
      Date.now() - LOCK_TIMEOUT_MINUTES * 60 * 1000,
    );

    const resetJobs = await this.workerJobAction.resetStaleJobs(staleTime);

    if (resetJobs.length > 0) {
      this.logger.warn(`Reset ${resetJobs.length} stale jobs back to pending`);
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