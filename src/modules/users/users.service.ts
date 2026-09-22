import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from './repositories/user.repository';
import { ChangePasswordDTO } from './dto/changePassword.dto';
import * as bcrypt from 'bcrypt';
import { UpdateResult } from 'typeorm';
import { generateSecret, generateURI } from 'otplib';
import { VALIDATION_LIMITS } from 'src/core/constants/limits';
import { MFAType, SetupMfaDTO } from './dto/setupMfa.dto';
import * as QrCode from 'qrcode';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async changePassword(
    changePasswordDto: ChangePasswordDTO,
    userId: string,
  ): Promise<UpdateResult> {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }

    const newPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    const result = this.userRepository.findUserByIdAndUpdatePassword(
      userId,
      newPassword,
    );

    return result;
  }

  async setupMfa(userId: string, setupMfaDto: SetupMfaDTO) {
    const user = await this.userRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const mfaEnabled = user.isMfaEnabled;

    if (mfaEnabled) {
      throw new BadRequestException('MFA already enabled');
    }

    switch (setupMfaDto.mfaType) {
      case MFAType.TOTP:
        const mfaSecret = generateSecret({
          length: VALIDATION_LIMITS.MFA_SECRET.LENGTH,
        });

        await this.userRepository.update(
          { id: user.id },
          { isMfaEnabled: true, mfaSecret: mfaSecret },
        );

        const otpAuthUrl = generateURI({
          secret: mfaSecret,
          issuer: 'PulseBoard',
          label: user.email,
        });

        const totpQrCode = await QrCode.toDataURL(otpAuthUrl);

        return { totpQrCode, mfaSecret };

      case MFAType.EMAIL_OTP:
        break;

      default:
        break;
    }

    // const otpAuthUrl = gener;
  }
}
