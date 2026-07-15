import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TransactionType } from '../../common/enums';
import { PaginationQueryDto } from '../../common/pagination.dto';

export class ListTransactionsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ description: 'Exact match on referenceId' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  referenceId?: string;
}
