export interface TimingWheelJob {
  id: string;
  scheduledAt: number; // Unix timestamp ms
  priority: number;
  createdAt: number;
}

export class TimingWheel {
  private readonly slots: Map<number, TimingWheelJob[]>;
  private readonly slotDurationMs: number;
  private readonly totalSlots: number;
  private currentSlot: number;

  constructor(totalSlots: number = 3600, slotDurationMs: number = 1000) {
    this.totalSlots = totalSlots;
    this.slotDurationMs = slotDurationMs;
    this.slots = new Map();
    this.currentSlot = this.getCurrentSlot();
  }

  private getCurrentSlot(): number {
    return Math.floor(Date.now() / this.slotDurationMs) % this.totalSlots;
  }

  private getSlotForTime(timestampMs: number): number {
    return Math.floor(timestampMs / this.slotDurationMs) % this.totalSlots;
  }

  insert(job: TimingWheelJob): void {
    const slot = this.getSlotForTime(job.scheduledAt);
    if (!this.slots.has(slot)) {
      this.slots.set(slot, []);
    }
    this.slots.get(slot)!.push(job);
  }

  /** Returns all jobs due at the current tick */
  tick(): TimingWheelJob[] {
    this.currentSlot = this.getCurrentSlot();
    const due = this.slots.get(this.currentSlot) ?? [];
    this.slots.delete(this.currentSlot);
    return due;
  }

  /** Returns jobs due now without advancing the wheel */
  getDueJobs(): TimingWheelJob[] {
    const now = Date.now();
    const dueJobs: TimingWheelJob[] = [];

    for (const [slot, jobs] of this.slots.entries()) {
      const slotTime = slot * this.slotDurationMs;
      if (slotTime <= now) {
        dueJobs.push(...jobs);
        this.slots.delete(slot);
      }
    }

    return dueJobs;
  }

  size(): number {
    let count = 0;
    for (const jobs of this.slots.values()) {
      count += jobs.length;
    }
    return count;
  }

  isEmpty(): boolean {
    return this.slots.size === 0;
  }
}