import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsInt,
  IsIn,
  IsDateString,
} from 'class-validator';
import { JobPriority } from '../enums/job-priority.enum';
import { RECURRING_INTERVALS } from '../enums/recurring-intervals.enum';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsNotEmpty()
  payload: Record<string, any>;

  @IsNotEmpty()
  @IsInt()
  @IsIn(Object.values(JobPriority))
  priority: number;

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @IsOptional()
  @IsString()
  @IsIn(RECURRING_INTERVALS)
  recurring_interval?: string;
}