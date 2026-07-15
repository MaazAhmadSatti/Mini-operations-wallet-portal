import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class WalletMoneyDto {
  @ApiProperty({
    example: '25.50',
    description: 'Positive decimal amount (up to 2 decimal places)',
  })
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'amount must be a positive decimal with up to 2 decimal places',
  })
  amount!: string;

  @ApiProperty({
    example: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    description: 'Client idempotency key (unique per wallet)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  referenceId!: string;

  @ApiPropertyOptional({ example: 'Ops top-up' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
