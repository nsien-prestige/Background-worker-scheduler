import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/entities/job.entity';
import { JobStatus } from '../jobs/enums/job-status.enum';
import { SchedulerService } from './scheduler/scheduler.service';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const BACKOFF_MULTIPLIER = 5;
const DLQ_THRESHOLD = 10;

@Injectable()
export class RetryService {
  private readonly logger = new Logger(RetryService.name);

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly schedulerService: SchedulerService,
  ) {}

  /** Calculates retry delay with exponential backoff and jitter */
  calculateDelay(attempt: number): number {
    const exponential = BASE_DELAY_MS * Math.pow(BACKOFF_MULTIPLIER, attempt);
    const jitter = Math.random() * 1000;
    return Math.floor(exponential + jitter);
  }

  /** Handles a failed job — retries or moves to DLQ */
  async handleFailure(job: Job, errorMessage: string): Promise<void> {
    const newRetryCount = job.retry_count + 1;

    if (newRetryCount < MAX_RETRIES) {
      await this.scheduleRetry(job, newRetryCount, errorMessage);
    } else {
      await this.moveToDLQ(job, errorMessage);
    }
  }

  /** Schedules a retry with exponential backoff */
  private async scheduleRetry(
    job: Job,
    retryCount: number,
    errorMessage: string,
  ): Promise<void> {
    const delay = this.calculateDelay(retryCount);
    const retryAt = new Date(Date.now() + delay);

    await this.jobRepository.update(job.id, {
      status: JobStatus.PENDING,
      retry_count: retryCount,
      error_message: errorMessage,
      scheduled_at: retryAt,
      locked_by: null,
      locked_at: null,
    });

    // Re-add to heap with new scheduled_at
    const updated = await this.jobRepository.findOne({
      where: { id: job.id },
    });
    if (updated) {
      this.schedulerService.addJob(updated);
    }

    this.logger.log(
      `Job ${job.id} scheduled for retry ${retryCount}/${MAX_RETRIES} in ${delay}ms`,
    );
  }

  /** Moves a job to the DLQ after exhausting all retries */
  private async moveToDLQ(job: Job, errorMessage: string): Promise<void> {
    await this.jobRepository.update(job.id, {
      status: JobStatus.FAILED,
      retry_count: MAX_RETRIES,
      error_message: errorMessage,
      is_dlq: true,
      dlq_reason: `Exhausted ${MAX_RETRIES} retry attempts. Last error: ${errorMessage}`,
      locked_by: null,
      locked_at: null,
    });

    this.logger.warn(`Job ${job.id} moved to DLQ after ${MAX_RETRIES} retries`);
    await this.checkDLQThreshold();
  }

  /** Sends alert if DLQ exceeds threshold */
  private async checkDLQThreshold(): Promise<void> {
    const dlqCount = await this.jobRepository.count({
      where: { is_dlq: true, status: JobStatus.FAILED },
    });

    if (dlqCount >= DLQ_THRESHOLD) {
      this.logger.error(
        `DLQ ALERT: ${dlqCount} jobs in dead letter queue — exceeds threshold of ${DLQ_THRESHOLD}`,
      );
      // In a real system this would send an email
      // For now we log it as a critical alert
    }
  }
}