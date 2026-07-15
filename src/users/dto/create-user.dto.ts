import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../../common/enums';

/** Letters and spaces only (no digits or special characters). */
const NAME_PATTERN = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

/** Digits only (no +, spaces, or other symbols). */
const PHONE_PATTERN = /^\d+$/;

export class CreateUserDto {
  @ApiProperty({ example: 'Alice Admin' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @Matches(NAME_PATTERN, {
    message:
      'name must contain only letters and spaces (no numbers or special characters)',
  })
  name!: string;

  @ApiProperty({ example: '10000000001' })
  @IsString()
  @MinLength(7)
  @MaxLength(15)
  @Matches(PHONE_PATTERN, {
    message: 'phone must contain digits only',
  })
  phone!: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
