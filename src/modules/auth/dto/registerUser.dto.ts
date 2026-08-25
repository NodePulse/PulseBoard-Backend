import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { VALIDATION_MESSAGES } from '../../../core/constants/messages';
import { VALIDATION_LIMITS } from '../../../core/constants/limits';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDTO {
  @ApiProperty({
    description: 'First name of the user',
    example: 'John',
    type: 'string',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('First name') })
  @MinLength(VALIDATION_LIMITS.FIRST_NAME.MIN, {
    message: VALIDATION_MESSAGES.MIN_LENGTH(
      'First name',
      VALIDATION_LIMITS.FIRST_NAME.MIN,
    ),
  })
  @MaxLength(VALIDATION_LIMITS.FIRST_NAME.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH(
      'First name',
      VALIDATION_LIMITS.FIRST_NAME.MAX,
    ),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('First name') })
  firstName: string;

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Doe',
    type: 'string',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Last name') })
  @MinLength(VALIDATION_LIMITS.LAST_NAME.MIN, {
    message: VALIDATION_MESSAGES.MIN_LENGTH(
      'Last name',
      VALIDATION_LIMITS.LAST_NAME.MIN,
    ),
  })
  @MaxLength(VALIDATION_LIMITS.LAST_NAME.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH(
      'Last name',
      VALIDATION_LIMITS.LAST_NAME.MAX,
    ),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Last name') })
  lastName: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'user@yopmail.com',
    type: 'string',
    required: true,
  })
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL('Email') })
  @MaxLength(VALIDATION_LIMITS.EMAIL.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH(
      'Email',
      VALIDATION_LIMITS.EMAIL.MAX,
    ),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Email') })
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'password@123',
    type: 'string',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Password') })
  @MinLength(VALIDATION_LIMITS.PASSWORD.MIN, {
    message: VALIDATION_MESSAGES.MIN_LENGTH(
      'Password',
      VALIDATION_LIMITS.PASSWORD.MIN,
    ),
  })
  @MaxLength(VALIDATION_LIMITS.PASSWORD.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH(
      'Password',
      VALIDATION_LIMITS.PASSWORD.MAX,
    ),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Password') })
  password: string;
}
