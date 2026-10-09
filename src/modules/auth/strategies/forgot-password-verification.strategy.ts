import { BadRequestException } from '@nestjs/common';
import { VerificationStrategy } from './verification-strategy.interface';
import { MailService } from 'src/core/mail/mail.service';
import { RedisService } from 'src/core/redis/redis.service';
import { UserRepository } from '../../users/repositories/user.repository';
import { User } from '../../users/entities/user.entity';
import { RESPONSE_MESSAGES, VERIFICATION_METHODS, VERIFICATION_TYPES, VALIDATION_MESSAGES } from 'src/core/constants/messages';
import { REDIS_KEYS } from 'src/core/constants/redis';
import * as bcrypt from 'bcrypt';

export class ForgotPasswordVerificationStrategy implements VerificationStrategy {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly generateOtp: () => string,
  ) {}

  async send(params: {
    user: User;
    email: string;
    method: string;
    verificationExpiresAt: Date;
    expiresIn: number;
    resendCooldown: number;
  }) {
    const { email, method, verificationExpiresAt, expiresIn, resendCooldown } = params;
    
    if (method === VERIFICATION_METHODS.MAGIC) {
      throw new BadRequestException(
        'Magic link not supported for password reset',
      );
    }

    const resetOtp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(resetOtp, 10);

    await this.redisService.set(
      REDIS_KEYS.PASSWORD_RESET_OTP(email),
      hashedOtp,
      expiresIn,
    );

    await this.mailService.sendPasswordResetEmail({
      to: email,
      otp: resetOtp,
    });

    return {
      message: RESPONSE_MESSAGES.AUTH.FORGOT_PASSWORD_SUCCESS,
      email,
      type: VERIFICATION_TYPES.FORGOT_PASSWORD,
      method: method || VERIFICATION_METHODS.OTP,
      expiresIn,
      expiresAt: verificationExpiresAt.toISOString(),
      resendCooldown,
    };
  }

  async verify(params: {
    email?: string;
    code: string;
    method?: string;
  }) {
    const { email, code, method } = params;
    const verifiedAt = new Date().toISOString();
    
    if (!email) throw new BadRequestException(VALIDATION_MESSAGES.REQUIRED('Email'));
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);

    const storedHashedOtp = await this.redisService.get(
      REDIS_KEYS.PASSWORD_RESET_OTP(email),
    );
    if (!storedHashedOtp) {
      throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_EXPIRED);
    }

    let hashedOtp = storedHashedOtp;
    if (storedHashedOtp.startsWith('{')) {
      try {
        const parsed = JSON.parse(storedHashedOtp);
        hashedOtp = parsed.hashedOtp;
      } catch {
        // ignore parsing error
      }
    }

    const isValid = await bcrypt.compare(code, hashedOtp);
    if (!isValid) {
      throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);
    }

    return {
      message: 'Password reset code verified successfully',
      email,
      type: VERIFICATION_TYPES.FORGOT_PASSWORD,
      method: method || VERIFICATION_METHODS.OTP,
      verified: true,
      verifiedAt,
    };
  }
}
