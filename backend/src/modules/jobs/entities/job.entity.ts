import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobStatus } from '../enums/job-status.enum';
import { JobPriority } from '../enums/job-priority.enum';

@Entity('jobs')
export class Job {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'send_email' })
  @Column()
  type: string;

  @ApiProperty({ example: { to: 'user@example.com', subject: 'Hello' } })
  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @ApiProperty({ enum: JobPriority, example: JobPriority.MEDIUM, description: '1=HIGH, 2=MEDIUM, 3=LOW' })
  @Column({ type: 'int', default: JobPriority.LOW })
  priority: number;

  @ApiProperty({ enum: JobStatus, example: JobStatus.PENDING })
  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  retry_count: number;

  @ApiProperty({ example: false })
  @Column({ type: 'boolean', default: false })
  is_dlq: boolean;

  @ApiPropertyOptional({ example: 'Max retries exceeded', nullable: true })
  @Column({ type: 'text', nullable: true })
  dlq_reason: string | null;

  @ApiProperty({ example: 0 })
  @Column({ type: 'int', default: 0 })
  dlq_retry_count: number;

  @ApiPropertyOptional({ example: 'Connection timeout', nullable: true })
  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @ApiPropertyOptional({ example: '2024-01-15T10:00:00.000Z', nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  scheduled_at: Date | null;

  @ApiPropertyOptional({ example: 'every_1_hour', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  recurring_interval: string | null;

  @ApiPropertyOptional({ example: 'worker-1', nullable: true })
  @Column({ type: 'varchar', nullable: true })
  locked_by: string | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  locked_at: Date | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  started_at: Date | null;

  @ApiPropertyOptional({ nullable: true })
  @Column({ type: 'timestamptz', nullable: true })
  completed_at: Date | null;

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}