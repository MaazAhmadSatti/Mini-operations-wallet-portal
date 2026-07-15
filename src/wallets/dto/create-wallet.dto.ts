import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { WalletStatus } from '../../common/enums';

export class CreateWalletDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ example: 'USD', description: 'Currency code' })
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  @Matches(/^[A-Za-z]+$/, {
    message: 'currency must be alphabetic (e.g. USD)',
  })
  currency!: string;

  @ApiPropertyOptional({ enum: WalletStatus, default: WalletStatus.ACTIVE })
  @IsOptional()
  @IsEnum(WalletStatus)
  status?: WalletStatus;
}
