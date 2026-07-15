import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class DailySummaryQueryDto {
  @ApiProperty({
    example: '2026-07-15',
    description: 'UTC calendar date (YYYY-MM-DD)',
  })
  @IsDateString()
  date!: string;
}
