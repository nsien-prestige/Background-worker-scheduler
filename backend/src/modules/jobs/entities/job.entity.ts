import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JobStatus } from '../enums/job-status.enum';
import { JobPriority } from '../enums/job-priority.enum';

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  type: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'int', default: JobPriority.LOW })
  priority: number;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @Column({ type: 'boolean', default: false })
  is_dlq: boolean;

  @Column({ type: 'text', nullable: true })
  dlq_reason: string | null;

  @Column({ type: 'int', default: 0 })
  dlq_retry_count: number;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  scheduled_at: Date | null;

  @Column({ type: 'varchar', nullable: true })
  recurring_interval: string | null;

  @Column({ type: 'varchar', nullable: true })
  locked_by: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  locked_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}