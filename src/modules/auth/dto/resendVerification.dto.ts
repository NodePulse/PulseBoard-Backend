import { IsEmail, IsIn, IsNotEmpty, IsString, MaxLength } from "class-validator";
import { VALIDATION_MESSAGES, VERIFICATION_METHODS } from "../../../core/constants/messages";
import { VALIDATION_LIMITS } from "../../../core/constants/limits";

export class ResendVerificationDTO {
  @IsEmail({}, { message: VALIDATION_MESSAGES.EMAIL('Email') })
  @MaxLength(VALIDATION_LIMITS.EMAIL.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Email', VALIDATION_LIMITS.EMAIL.MAX),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Email') })
  email: string;

  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Method') })
  @IsIn([VERIFICATION_METHODS.MAGIC, VERIFICATION_METHODS.OTP], {
    message: VALIDATION_MESSAGES.METHOD_INVALID('Method'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Method') })
  method: typeof VERIFICATION_METHODS.MAGIC | typeof VERIFICATION_METHODS.OTP;
}
