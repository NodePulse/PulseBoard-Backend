import { BadRequestException } from '@nestjs/common';
import { VerificationStrategy } from './verification-strategy.interface';
import { UserRepository } from '../../users/repositories/user.repository';
import { MailService } from 'src/core/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/core/redis/redis.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../../notifications/entities/notification-type.enum';
import { User } from '../../users/entities/user.entity';
import { RESPONSE_MESSAGES, VERIFICATION_METHODS, VERIFICATION_TYPES, VALIDATION_MESSAGES } from 'src/core/constants/messages';
import { REDIS_KEYS } from 'src/core/constants/redis';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

export class SignupVerificationStrategy implements VerificationStrategy {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly notificationsService: NotificationsService,
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
    const { user, email, method, verificationExpiresAt, expiresIn, resendCooldown } = params;
    
    if (user.isEmailVerified) {
      throw new BadRequestException(RESPONSE_MESSAGES.EMAIL_ALREADY_VERIFIED);
    }

    if (method === VERIFICATION_METHODS.MAGIC) {
      return this.sendSignupMagicLink(user, email, verificationExpiresAt, expiresIn, resendCooldown);
    } else {
      return this.sendSignupOtp(email, method, verificationExpiresAt, expiresIn, resendCooldown);
    }
  }

  async verify(params: {
    email?: string;
    code: string;
    method?: string;
  }) {
    const { email, code, method } = params;
    const verifiedAt = new Date().toISOString();

    if (method === VERIFICATION_METHODS.MAGIC) {
      const user = await this.userRepository.findOne({
        where: { verificationToken: code },
      });

      if (!user) {
        throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);
      }

      if (user.verificationExpiresAt && new Date() > user.verificationExpiresAt) {
        throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_EXPIRED);
      }

      user.isEmailVerified = true;
      user.verificationToken = null;
      user.verificationOtp = null;
      user.verificationExpiresAt = null;

      await this.userRepository.save(user);
      await this.mailService.cleanCompletedJobs();

      await this.notificationsService.createNotification({
        recipientId: user.id,
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.IN_APP,
        title: 'Welcome to PulseBoard!',
        body: 'Your account has been successfully verified. Let’s get started!',
      });

      return {
        message: RESPONSE_MESSAGES.VERIFICATION_SUCCESS,
        email: user.email,
        type: VERIFICATION_TYPES.SIGNUP,
        method,
        verified: true,
        verifiedAt,
      };
    } else {
      if (!email) throw new BadRequestException(VALIDATION_MESSAGES.REQUIRED('Email'));
      
      const user = await this.userRepository.findUserByEmail(email);
      if (!user) throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);

      const storedHashedOtp = await this.redisService.get(REDIS_KEYS.OTP(email));
      if (!storedHashedOtp) {
        throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_EXPIRED);
      }

      const isValid = await bcrypt.compare(code, storedHashedOtp);
      if (!isValid) {
        throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);
      }

      user.isEmailVerified = true;
      user.verificationToken = null;
      user.verificationOtp = null;
      user.verificationExpiresAt = null;

      await this.userRepository.save(user);
      await this.redisService.del(REDIS_KEYS.OTP(email));

      await this.notificationsService.createNotification({
        recipientId: user.id,
        type: NotificationType.SYSTEM,
        channel: NotificationChannel.IN_APP,
        title: 'Welcome to PulseBoard!',
        body: 'Your account has been successfully verified. Let’s get started!',
      });

      return {
        message: RESPONSE_MESSAGES.VERIFICATION_SUCCESS,
        email,
        type: VERIFICATION_TYPES.SIGNUP,
        method,
        verified: true,
        verifiedAt,
      };
    }
  }

  private async sendSignupMagicLink(
    user: User,
    email: string,
    verificationExpiresAt: Date,
    expiresIn: number,
    resendCooldown: number,
  ) {
    const verificationToken = randomUUID();
    user.verificationToken = verificationToken;
    user.verificationOtp = null;
    user.verificationExpiresAt = verificationExpiresAt;
    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const magicLink = `${frontendUrl}/verify-magic?token=${verificationToken}`;

    await this.mailService.sendVerificationEmail({
      to: email,
      magicLink,
      jobId: randomUUID(),
    });
    await this.userRepository.save(user);

    return {
      message: 'Verification magic link sent successfully to email',
      email,
      type: VERIFICATION_TYPES.SIGNUP,
      method: VERIFICATION_METHODS.MAGIC,
      expiresIn,
      expiresAt: verificationExpiresAt.toISOString(),
      resendCooldown,
    };
  }

  private async sendSignupOtp(
    email: string,
    method: string,
    verificationExpiresAt: Date,
    expiresIn: number,
    resendCooldown: number,
  ) {
    const verificationOtp = this.generateOtp();
    const hashedOtp = await bcrypt.hash(verificationOtp, 10);

    // Store hashed OTP in Redis securely
    await this.redisService.set(REDIS_KEYS.OTP(email), hashedOtp, expiresIn);

    await this.mailService.sendVerificationEmail({
      to: email,
      otp: verificationOtp,
      jobId: randomUUID(),
    });

    return {
      message: 'Verification OTP code sent successfully to email',
      email,
      type: VERIFICATION_TYPES.SIGNUP,
      method,
      expiresIn,
      expiresAt: verificationExpiresAt.toISOString(),
      resendCooldown,
    };
  }
}
