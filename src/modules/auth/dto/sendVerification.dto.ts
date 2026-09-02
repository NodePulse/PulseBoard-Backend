import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { VALIDATION_MESSAGES, VERIFICATION_METHODS, VERIFICATION_TYPES } from '../../../core/constants/messages';
import { VALIDATION_LIMITS } from '../../../core/constants/limits';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendVerificationDTO {
  @ApiProperty({
    description: 'Email of the user',
    example: 'user@yopmail.com',
    type: 'string',
    required: true,
  })
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL('Email') })
  @MaxLength(VALIDATION_LIMITS.EMAIL.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Email', VALIDATION_LIMITS.EMAIL.MAX),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Email') })
  email: string;

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
    description: 'Verification method',
    enum: [VERIFICATION_METHODS.MAGIC, VERIFICATION_METHODS.OTP],
  })
  @IsOptional()
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Method') })
  @IsIn([VERIFICATION_METHODS.MAGIC, VERIFICATION_METHODS.OTP], {
    message: VALIDATION_MESSAGES.METHOD_INVALID('Method'),
  })
  method?: string;
}
