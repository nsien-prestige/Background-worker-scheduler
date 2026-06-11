import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsInt,
  IsIn,
  IsDateString,
} from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsNotEmpty()
  payload: Record<string, any>;

  @IsNotEmpty()
  @IsInt()
  @IsIn([1, 2, 3])
  priority: number;

  @IsOptional()
  @IsDateString()
  scheduled_at?: string;

  @IsOptional()
  @IsString()
  @IsIn(['every_1_minute', 'every_5_minutes', 'every_1_hour'])
  recurring_interval?: string;
}