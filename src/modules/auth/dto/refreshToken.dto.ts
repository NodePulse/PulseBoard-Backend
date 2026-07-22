import { IsNotEmpty, IsString } from "class-validator";
import { VALIDATION_MESSAGES } from "../../../core/constants/messages";

export class RefreshTokenDTO {
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Refresh token') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Refresh token') })
  refreshToken: string;
}
