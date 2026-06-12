import { Job } from '../../../jobs/entities/job.entity';

export class MinHeap {
  private heap: Job[] = [];

  private compare(a: Job, b: Job): boolean {
    // 1. Compare priority (1 = high, 3 = low — lower number wins)
    if (a.priority !== b.priority) {
      return a.priority < b.priority;
    }

    // 2. Compare scheduled_at (earlier wins, null means run immediately)
    const aTime = a.scheduled_at ? a.scheduled_at.getTime() : 0;
    const bTime = b.scheduled_at ? b.scheduled_at.getTime() : 0;
    if (aTime !== bTime) {
      return aTime < bTime;
    }

    // 3. Compare created_at (older wins)
    return a.created_at.getTime() < b.created_at.getTime();
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.heap[index], this.heap[parent])) {
        this.swap(index, parent);
        index = parent;
      } else {
        break;
      }
    }
  }

  private bubbleDown(index: number): void {
    const length = this.heap.length;

    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < length && this.compare(this.heap[left], this.heap[smallest])) {
        smallest = left;
      }

      if (right < length && this.compare(this.heap[right], this.heap[smallest])) {
        smallest = right;
      }

      if (smallest !== index) {
        this.swap(index, smallest);
        index = smallest;
      } else {
        break;
      }
    }
  }

  insert(job: Job): void {
    this.heap.push(job);
    this.bubbleUp(this.heap.length - 1);
  }

  extractMin(): Job | null {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop()!;

    const min = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.bubbleDown(0);
    return min;
  }

  peek(): Job | null {
    return this.heap[0] ?? null;
  }

  remove(jobId: string): void {
    const index = this.heap.findIndex(j => j.id === jobId);
    if (index === -1) return;

    this.heap[index] = this.heap.pop()!;
    if (index < this.heap.length) {
      this.bubbleUp(index);
      this.bubbleDown(index);
    }
  }

  size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }
}