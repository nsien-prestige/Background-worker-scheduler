import { Injectable, Logger } from '@nestjs/common';
import { MinHeap } from '../heap/min-heap';
import { TimingWheel, TimingWheelJob } from '../timing-wheel/timing-wheel';
import { Job } from '../../../jobs/entities/job.entity';
import { JobStatus } from '../../../jobs/enums/job-status.enum';

export interface BenchmarkResult {
  algorithm: string;
  insertionTimeMs: number;
  extractionTimeMs: number;
  totalJobs: number;
  opsPerSecond: number;
}

@Injectable()
export class SchedulerBenchmarkService {
  private readonly logger = new Logger(SchedulerBenchmarkService.name);

  /** Creates mock jobs for benchmarking */
  private createMockJobs(count: number): Job[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `job-${i}`,
      type: 'send_email',
      payload: {},
      priority: (i % 3) + 1,
      status: JobStatus.PENDING,
      retry_count: 0,
      error_message: null,
      scheduled_at: new Date(Date.now() + Math.random() * 60000),
      recurring_interval: null,
      locked_by: null,
      locked_at: null,
      started_at: null,
      completed_at: null,
      is_dlq: false,
      dlq_reason: null,
      dlq_retry_count: 0,
      created_at: new Date(Date.now() - Math.random() * 10000),
      updated_at: new Date(),
    })) as Job[];
  }

  /** Benchmarks the min-heap */
  benchmarkHeap(jobCount: number): BenchmarkResult {
    const heap = new MinHeap();
    const jobs = this.createMockJobs(jobCount);

    // Benchmark insertion
    const insertStart = performance.now();
    for (const job of jobs) {
      heap.insert(job);
    }
    const insertEnd = performance.now();

    // Benchmark extraction
    const extractStart = performance.now();
    while (!heap.isEmpty()) {
      heap.extractMin();
    }
    const extractEnd = performance.now();

    const insertionTimeMs = insertEnd - insertStart;
    const extractionTimeMs = extractEnd - extractStart;
    const totalTimeMs = insertionTimeMs + extractionTimeMs;
    const opsPerSecond = Math.floor((jobCount * 2) / (totalTimeMs / 1000));

    return {
      algorithm: 'MinHeap',
      insertionTimeMs: Math.round(insertionTimeMs * 100) / 100,
      extractionTimeMs: Math.round(extractionTimeMs * 100) / 100,
      totalJobs: jobCount,
      opsPerSecond,
    };
  }

  /** Benchmarks the timing wheel */
  benchmarkTimingWheel(jobCount: number): BenchmarkResult {
    const wheel = new TimingWheel();
    const jobs = this.createMockJobs(jobCount);

    // Convert to timing wheel format
    const twJobs: TimingWheelJob[] = jobs.map(j => ({
      id: j.id,
      scheduledAt: j.scheduled_at?.getTime() ?? Date.now(),
      priority: j.priority,
      createdAt: j.created_at.getTime(),
    }));

    // Benchmark insertion
    const insertStart = performance.now();
    for (const job of twJobs) {
      wheel.insert(job);
    }
    const insertEnd = performance.now();

    // Benchmark extraction
    const extractStart = performance.now();
    wheel.getDueJobs();
    const extractEnd = performance.now();

    const insertionTimeMs = insertEnd - insertStart;
    const extractionTimeMs = extractEnd - extractStart;
    const totalTimeMs = insertionTimeMs + extractionTimeMs;
    const opsPerSecond = Math.floor((jobCount * 2) / (totalTimeMs / 1000));

    return {
      algorithm: 'TimingWheel',
      insertionTimeMs: Math.round(insertionTimeMs * 100) / 100,
      extractionTimeMs: Math.round(extractionTimeMs * 100) / 100,
      totalJobs: jobCount,
      opsPerSecond,
    };
  }

  /** Runs full benchmark comparison */
  runBenchmark(jobCount: number = 10000): {
    heap: BenchmarkResult;
    timingWheel: BenchmarkResult;
    winner: string;
    summary: string;
  } {
    this.logger.log(`Running benchmark with ${jobCount} jobs...`);

    const heapResult = this.benchmarkHeap(jobCount);
    const twResult = this.benchmarkTimingWheel(jobCount);

    const heapTotal = heapResult.insertionTimeMs + heapResult.extractionTimeMs;
    const twTotal = twResult.insertionTimeMs + twResult.extractionTimeMs;

    const winner = heapTotal < twTotal ? 'MinHeap' : 'TimingWheel';

    const summary = `
Benchmark Results (${jobCount} jobs):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MinHeap:
  Insertion:  ${heapResult.insertionTimeMs}ms
  Extraction: ${heapResult.extractionTimeMs}ms
  Ops/sec:    ${heapResult.opsPerSecond}

TimingWheel:
  Insertion:  ${twResult.insertionTimeMs}ms
  Extraction: ${twResult.extractionTimeMs}ms
  Ops/sec:    ${twResult.opsPerSecond}

Winner: ${winner}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    this.logger.log(summary);

    return { heap: heapResult, timingWheel: twResult, winner, summary };
  }
}