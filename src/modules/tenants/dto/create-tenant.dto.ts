import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";
import { VALIDATION_MESSAGES } from "../../../core/constants/messages";
import { VALIDATION_LIMITS } from "../../../core/constants/limits";
import { REGEX_PATTERNS } from "../../../core/constants/regex";

export class CreateTenantDTO {
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Tenant name') })
  @MaxLength(VALIDATION_LIMITS.TENANT_NAME.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Tenant name', VALIDATION_LIMITS.TENANT_NAME.MAX),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Tenant name') })
  name: string;

  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Tenant slug') })
  @MaxLength(VALIDATION_LIMITS.TENANT_SLUG.MAX, {
    message: VALIDATION_MESSAGES.MAX_LENGTH('Tenant slug', VALIDATION_LIMITS.TENANT_SLUG.MAX),
  })
  @Matches(REGEX_PATTERNS.SLUG, {
    message: VALIDATION_MESSAGES.SLUG_FORMAT('Tenant slug'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Tenant slug') })
  slug: string;
}
