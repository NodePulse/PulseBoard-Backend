import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { VALIDATION_MESSAGES } from "../../../core/constants/messages";
import { VALIDATION_LIMITS } from "../../../core/constants/limits";

export class VerifyOtpDTO {
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL('Email') })
  @MaxLength(VALIDATION_LIMITS.EMAIL.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Email', VALIDATION_LIMITS.EMAIL.MAX),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Email') })
  email: string;

  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('OTP') })
  @MinLength(6, { message: VALIDATION_MESSAGES.MIN_LENGTH('OTP', 6) })
  @MaxLength(6, { message: VALIDATION_MESSAGES.MAX_LENGTH('OTP', 6) })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('OTP') })
  otp: string;
}
