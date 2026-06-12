import { ApiProperty } from '@nestjs/swagger';
import { Job } from '../entities/job.entity';

class PaginationMeta {
  @ApiProperty({ example: 150, description: 'Total number of matching records' })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 8, description: 'Total number of pages' })
  totalPages: number;
}

export class PaginatedJobsResponseDto {
  @ApiProperty({ type: [Job] })
  data: Job[];

  @ApiProperty({ type: PaginationMeta })
  meta: PaginationMeta;
}
