import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { VALIDATION_MESSAGES } from '../../../core/constants/messages';
import { VALIDATION_LIMITS } from '../../../core/constants/limits';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../../core/decorators/match.decorator';
import { NotMatch } from '../../../core/decorators/not-match.decorator';

export class ChangePasswordDTO {
  @ApiProperty({
    description: 'Current Password',
    example: 'password@123',
    type: 'string',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Current Password') })
  @MinLength(VALIDATION_LIMITS.PASSWORD.MIN, {
    message: VALIDATION_MESSAGES.MIN_LENGTH(
      'Current Password',
      VALIDATION_LIMITS.PASSWORD.MIN,
    ),
  })
  @MaxLength(VALIDATION_LIMITS.PASSWORD.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH(
      'Current Password',
      VALIDATION_LIMITS.PASSWORD.MAX,
    ),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Current Password') })
  currentPassword: string;

  @ApiProperty({
    description: 'New Password',
    example: 'password@123',
    type: 'string',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('New Password') })
  @MinLength(VALIDATION_LIMITS.PASSWORD.MIN, {
    message: VALIDATION_MESSAGES.MIN_LENGTH(
      'New Password',
      VALIDATION_LIMITS.PASSWORD.MIN,
    ),
  })
  @MaxLength(VALIDATION_LIMITS.PASSWORD.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH(
      'New Password',
      VALIDATION_LIMITS.PASSWORD.MAX,
    ),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('New Password') })
  @NotMatch('currentPassword', {
    message: 'New password must not be the same as current password',
  })
  newPassword: string;

  @ApiProperty({
    description: 'Confirm Password',
    example: 'password@123',
    type: 'string',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Confirm Password') })
  @MinLength(VALIDATION_LIMITS.PASSWORD.MIN, {
    message: VALIDATION_MESSAGES.MIN_LENGTH(
      'Confirm Password',
      VALIDATION_LIMITS.PASSWORD.MIN,
    ),
  })
  @MaxLength(VALIDATION_LIMITS.PASSWORD.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH(
      'Confirm Password',
      VALIDATION_LIMITS.PASSWORD.MAX,
    ),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Confirm Password') })
  @Match('newPassword', {
    message: 'Confirm password must match new password',
  })
  confirmPassword: string;
}
