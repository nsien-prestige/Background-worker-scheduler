import { Injectable, Logger } from '@nestjs/common';
import { Job } from '../jobs/entities/job.entity';
import { SchedulerService } from './scheduler/scheduler.service';
import { RetryJobAction } from './actions/retry-job.action';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const BACKOFF_MULTIPLIER = 5;
const DLQ_THRESHOLD = 10;

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  constructor(
    private readonly retryJobAction: RetryJobAction,
    private readonly schedulerService: SchedulerService,
  ) {}

  calculateDelay(attempt: number): number {
    const exponential = BASE_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt);
    const jitter = Math.random() * 1000;
    return Math.floor(exponential + jitter);
  }

  async handleFailure(job: Job, errorMessage: string): Promise<void> {
    const newRetryCount = job.retry_count + 1;

    if (newRetryCount < MAX_RETRIES) {
      await this.scheduleRetry(job, newRetryCount, errorMessage);
    } else {
      await this.moveToDLQ(job, errorMessage);
    }
  }

  private async scheduleRetry(
    job: Job,
    retryCount: number,
    errorMessage: string,
  ): Promise<void> {
    const delay = this.calculateDelay(retryCount);
    const retryAt = new Date(Date.now() + delay);

    await this.retryJobAction.scheduleRetry(
      job.id,
      retryCount,
      errorMessage,
      retryAt,
    );

    const updated = await this.retryJobAction.findForHeap(job.id);
    if (updated) {
      this.schedulerService.addJob(updated);
    }

    this.logger.log(
      `Job ${job.id} scheduled for retry ${retryCount}/${MAX_RETRIES} in ${delay}ms`,
    );
  }

  private async moveToDLQ(job: Job, errorMessage: string): Promise<void> {
    await this.retryJobAction.moveToDLQ(job.id, errorMessage, MAX_RETRIES);
    this.logger.warn(`Job ${job.id} moved to DLQ after ${MAX_RETRIES} retries`);
    await this.checkDLQThreshold();
  }

  private async checkDLQThreshold(): Promise<void> {
    const dlqCount = await this.retryJobAction.countDLQ();

    if (dlqCount >= DLQ_THRESHOLD) {
      this.logger.error(
        `DLQ ALERT: ${dlqCount} jobs in dead letter queue — exceeds threshold of ${DLQ_THRESHOLD}`,
      );
    }
  }
}