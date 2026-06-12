import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Job } from '../../jobs/entities/job.entity';
import { MinHeap } from './heap/min-heap';
import { SchedulerJobAction } from './actions/scheduler-job.action';

const SCHEDULED_JOBS_CHECK_INTERVAL_MS = 10_000;
const AGING_INTERVAL_MS = 30_000;
const AGING_THRESHOLD_MS = 60_000;
const AGING_BOOST = 1;

@Injectable()
export class SchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly heap = new MinHeap();

  constructor(
    private readonly schedulerJobAction: SchedulerJobAction,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.loadJobsIntoHeap();
    this.logger.log(`Heap initialized with ${this.heap.size()} jobs`);
    this.startScheduledJobsCheck();
    this.startAgingCheck();
  }

  private async loadJobsIntoHeap(): Promise<void> {
    const jobs = await this.schedulerJobAction.loadPendingJobs();
    for (const job of jobs) {
      this.heap.insert(job);
    }
  }

  private startScheduledJobsCheck(): void {
    setInterval(async () => {
      const dueJobs = await this.schedulerJobAction.findDueJobs();
      for (const job of dueJobs) {
        if (!this.isInHeap(job.id)) {
          this.heap.insert(job);
          this.logger.log(`Scheduled job ${job.id} is now due — added to heap`);
        }
      }
    }, SCHEDULED_JOBS_CHECK_INTERVAL_MS);
  }

  private startAgingCheck(): void {
    setInterval(async () => {
      await this.applyPriorityAging();
    }, AGING_INTERVAL_MS);
  }

  private async applyPriorityAging(): Promise<void> {
    const staleJobs = await this.schedulerJobAction.findPendingUnscheduled();

    for (const job of staleJobs) {
      const waitTime = Date.now() - job.created_at.getTime();
      if (waitTime > AGING_THRESHOLD_MS && job.priority > 1) {
        this.heap.remove(job.id);
        job.priority = Math.max(1, job.priority - AGING_BOOST);

        await this.schedulerJobAction.updatePriority(job.id, job.priority);
        
        this.heap.insert(job);
        this.logger.log(
          `Priority aging applied to job ${job.id} — new priority: ${job.priority}`,
        );
      }
    }
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