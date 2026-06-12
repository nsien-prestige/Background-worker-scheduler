import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { JobStatus } from '../../jobs/enums/job-status.enum';
import { MinHeap } from './heap/min-heap';

const SCHEDULED_JOBS_CHECK_INTERVAL_MS = 10_000;

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly heap = new MinHeap();

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadJobsIntoHeap();
    this.logger.log(`Heap initialized with ${this.heap.size()} jobs`);
    this.startScheduledJobsCheck();
  }

  private async loadJobsIntoHeap(): Promise<void> {
    const jobs = await this.jobRepository.find({
      where: [
        { status: JobStatus.PENDING, scheduled_at: IsNull() },
        {
          status: JobStatus.PENDING,
          scheduled_at: LessThanOrEqual(new Date()),
        },
      ],
    });

    for (const job of jobs) {
      this.heap.insert(job);
    }
  }

  /** Periodically checks for future-scheduled jobs that are now due */
  private startScheduledJobsCheck(): void {
    setInterval(async () => {
      const dueJobs = await this.jobRepository.find({
        where: {
          status: JobStatus.PENDING,
          scheduled_at: LessThanOrEqual(new Date()),
        },
      });

      for (const job of dueJobs) {
        // Only add if not already in heap
        if (!this.isInHeap(job.id)) {
          this.heap.insert(job);
          this.logger.log(`Scheduled job ${job.id} is now due — added to heap`);
        }
      }
    }, SCHEDULED_JOBS_CHECK_INTERVAL_MS);
  }

  addJob(job: Job): void {
    if (!job.scheduled_at || job.scheduled_at <= new Date()) {
      this.heap.insert(job);
    }
  }

  getNextJob(): Job | null {
    return this.heap.extractMin();
  }

  removeJob(jobId: string): void {
    this.heap.remove(jobId);
  }

  isInHeap(jobId: string): boolean {
    return this.heap.contains(jobId);
  }

  heapSize(): number {
    return this.heap.size();
  }
}