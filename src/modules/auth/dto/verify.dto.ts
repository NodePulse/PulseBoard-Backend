import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES, VERIFICATION_METHODS, VERIFICATION_TYPES } from '../../../core/constants/messages';
import { VALIDATION_LIMITS } from '../../../core/constants/limits';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyDTO {
  @ApiPropertyOptional({
    description: 'Email of the user (required for OTP)',
    example: 'user@yopmail.com',
    type: 'string',
  })
  @IsOptional()
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL('Email') })
  @MaxLength(VALIDATION_LIMITS.EMAIL.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Email', VALIDATION_LIMITS.EMAIL.MAX),
  })
  email?: string;

  @ApiProperty({
    description: 'Verification code (OTP or Magic Token)',
    type: 'string',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Code') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Code') })
  code: string;

  @ApiProperty({
    description: 'Verification type',
    enum: [VERIFICATION_TYPES.SIGNUP, VERIFICATION_TYPES.FORGOT_PASSWORD],
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Type') })
  @IsIn([VERIFICATION_TYPES.SIGNUP, VERIFICATION_TYPES.FORGOT_PASSWORD], {
    message: VALIDATION_MESSAGES.TYPE_INVALID('Type'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Type') })
  type: string;

  @ApiPropertyOptional({
    description: 'Verification method (magic or otp)',
    enum: [VERIFICATION_METHODS.MAGIC, VERIFICATION_METHODS.OTP],
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Method') })
  @IsIn([VERIFICATION_METHODS.MAGIC, VERIFICATION_METHODS.OTP], {
    message: VALIDATION_MESSAGES.METHOD_INVALID('Method'),
  })
  method?: string;
}
