import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsInt,
  IsIn,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { JobPriority } from '../enums/job-priority.enum';
import { RECURRING_INTERVALS } from '../enums/recurring-intervals.enum';

export class CreateJobDto {
  @ApiProperty({ example: 'send_email', description: 'Job type identifier used to route to the correct handler' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: { to: 'user@example.com', subject: 'Welcome' }, description: 'Arbitrary JSON payload passed to the job handler' })
  @IsObject()
  @IsNotEmpty()
  payload: Record<string, any>;

  @ApiProperty({ enum: Object.values(JobPriority), example: JobPriority.MEDIUM, description: '1=HIGH, 2=MEDIUM, 3=LOW' })
  @IsNotEmpty()
  @IsInt()
  @IsIn(Object.values(JobPriority))
  priority: number;

  @ApiPropertyOptional({ example: '2024-01-15T10:00:00.000Z', description: 'ISO 8601 datetime to delay execution until' })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @ApiPropertyOptional({ enum: RECURRING_INTERVALS, example: 'every_1_hour', description: 'Recurrence interval; a new job is created after each successful run' })
  @IsOptional()
  @IsString()
  @IsIn(RECURRING_INTERVALS)
  recurring_interval?: string;
}