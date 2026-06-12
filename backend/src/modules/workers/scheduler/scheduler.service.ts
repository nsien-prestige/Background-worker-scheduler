import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull } from 'typeorm';
import { Job } from '../../jobs/entities/job.entity';
import { JobStatus } from '../../jobs/enums/job-status.enum';
import { MinHeap } from './heap/min-heap';

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly heap = new MinHeap();

  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
  ) {}

  /** Loads all pending due jobs into the heap on startup */
  async onModuleInit(): Promise<void> {
    await this.loadJobsIntoHeap();
    this.logger.log(`Heap initialized with ${this.heap.size()} jobs`);
  }

  /** Pulls all pending jobs with scheduled_at <= now into the heap */
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

  /** Called when a new job is created via the API */
  addJob(job: Job): void {
    if (!job.scheduled_at || job.scheduled_at <= new Date()) {
      this.heap.insert(job);
    }
  }

  /** Called by the worker to get the next job to process */
  getNextJob(): Job | null {
    return this.heap.extractMin();
  }

  /** Called when a job is cancelled so it's removed from the heap */
  removeJob(jobId: string): void {
    this.heap.remove(jobId);
  }

  heapSize(): number {
    return this.heap.size();
  }
}