import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { VALIDATION_MESSAGES } from "../../../core/constants/messages";
import { VALIDATION_LIMITS } from "../../../core/constants/limits";

export class LoginUserDTO {
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL('Email') })
  @MaxLength(VALIDATION_LIMITS.EMAIL.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Email', VALIDATION_LIMITS.EMAIL.MAX),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Email') })
  email: string;

  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Password') })
  @MinLength(VALIDATION_LIMITS.PASSWORD.MIN, {
    message: VALIDATION_MESSAGES.MIN_LENGTH('Password', VALIDATION_LIMITS.PASSWORD.MIN),
  })
  @MaxLength(VALIDATION_LIMITS.PASSWORD.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Password', VALIDATION_LIMITS.PASSWORD.MAX),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Password') })
  password: string;
}
