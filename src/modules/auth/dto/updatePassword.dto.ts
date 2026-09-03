import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../../core/constants/messages';
import { VALIDATION_LIMITS } from '../../../core/constants/limits';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePasswordDTO {
  @ApiProperty({
    description: 'Password update mode: "forgot" (unauthenticated OTP reset) or "change" (authenticated password update)',
    enum: ['forgot', 'change'],
    example: 'forgot',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Mode') })
  @IsIn(['forgot', 'change'], {
    message: 'Mode must be either "forgot" or "change"',
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Mode') })
  mode: 'forgot' | 'change';
  @ApiPropertyOptional({
    description: 'Email of the user (Required for unauthenticated OTP password reset)',
    example: 'user@example.com',
    type: 'string',
  })
  @IsOptional()
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL('Email') })
  @MaxLength(VALIDATION_LIMITS.EMAIL.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH(
      'Email',
      VALIDATION_LIMITS.EMAIL.MAX,
    ),
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Verification OTP code (Required for unauthenticated OTP password reset)',
    type: 'string',
    example: '123456',
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Code') })
  code?: string;

  @ApiPropertyOptional({
    description: 'Current password (Required for authenticated password change)',
    type: 'string',
    example: 'CurrentP@ssword123',
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Current password') })
  currentPassword?: string;

  @ApiProperty({
    description: 'New password (min 8 chars)',
    type: 'string',
    example: 'NewSecureP@ssword123',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('New password') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('New password') })
  @MinLength(VALIDATION_LIMITS.PASSWORD.MIN, {
    message: VALIDATION_MESSAGES.MIN_LENGTH(
      'New password',
      VALIDATION_LIMITS.PASSWORD.MIN,
    ),
  })
  @MaxLength(VALIDATION_LIMITS.PASSWORD.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH(
      'New password',
      VALIDATION_LIMITS.PASSWORD.MAX,
    ),
  })
  newPassword: string;
}
