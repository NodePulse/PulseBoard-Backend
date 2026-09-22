import { IsEnum, IsNotEmpty } from 'class-validator';
import { VALIDATION_MESSAGES } from 'src/core/constants/messages';
import { ApiProperty } from '@nestjs/swagger';

export enum MFAType {
  TOTP = 'TOTP',
  PASSKEY = 'PASSKEY',
  EMAIL_OTP = 'EMAIL_OTP',
}

export class SetupMfaDTO {
  @ApiProperty({
    description: 'Type of MFA to setup',
    enum: MFAType,
    example: MFAType.TOTP,
    required: true,
  })
  @IsEnum(MFAType, {
    message: VALIDATION_MESSAGES.TYPE_INVALID('MFA Type'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('MFA Type') })
  mfaType: MFAType;
}
