import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Session } from './entities/session.entity';
import { RegisterUserDTO } from './dto/registerUser.dto';
import { LoginUserDTO } from './dto/loginUser.dto';
import { SendVerificationDTO } from './dto/sendVerification.dto';
import { VerifyDTO } from './dto/verify.dto';
import { UpdatePasswordDTO } from './dto/updatePassword.dto';
import * as bcrypt from 'bcrypt';
import {
  RESPONSE_MESSAGES,
  VALIDATION_MESSAGES,
  VERIFICATION_METHODS,
  VERIFICATION_TYPES,
} from '../../core/constants/messages';
import { REDIS_KEYS } from '../../core/constants/redis';
import { API_ROUTES } from '../../core/constants/routes';
import { UserRepository } from '../users/repositories/user.repository';
import { ConfigService } from '@nestjs/config';
import { randomUUID, randomInt } from 'crypto';
import { RedisService } from 'src/core/redis/redis.service';
import { MailService } from 'src/core/mail/mail.service';
import { SessionCacheService } from '../session/session-cache.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly sessionCacheService: SessionCacheService,
  ) {}

  private generateSecureOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  // FUNC
  private parseUserAgent(userAgentString?: string) {
    if (!userAgentString) {
      return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    }

    let browser = 'Unknown';
    let os = 'Unknown';
    let device = 'Desktop';

    const ua = userAgentString.toLowerCase();

    // Parse Browser
    if (ua.includes('firefox')) {
      browser = 'Firefox';
    } else if (ua.includes('chrome') && !ua.includes('chromium')) {
      browser = 'Chrome';
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browser = 'Safari';
    } else if (ua.includes('edge')) {
      browser = 'Edge';
    }

    // Parse OS
    if (ua.includes('windows')) {
      os = 'Windows';
    } else if (ua.includes('macintosh') || ua.includes('mac os')) {
      os = 'macOS';
    } else if (ua.includes('iphone') || ua.includes('ipad')) {
      os = 'iOS';
      device = ua.includes('iphone') ? 'iPhone' : 'iPad';
    } else if (ua.includes('android')) {
      os = 'Android';
      device = 'Mobile Device';
    } else if (ua.includes('linux')) {
      os = 'Linux';
    }

    return { browser, os, device };
  }

  // SERVICE
  public async registerUser(dto: RegisterUserDTO): Promise<{
    message: string;
    user: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      isEmailVerified: boolean;
    };
    verification: {
      sent: boolean;
      method: string;
      expiresIn: number;
      expiresAt: string;
    };
  }> {
    const { email, firstName, lastName, password } = dto;

    const existingUser = await this.userRepository.findUserByEmail(email);
    if (existingUser) {
      throw new ConflictException(RESPONSE_MESSAGES.CONFLICT_EMAIL);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const verificationToken = randomUUID();
    const verificationExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const user = this.userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      tenantId: null,
      isEmailVerified: false,
      verificationToken,
      verificationOtp: null,
      verificationExpiresAt,
    });

    const savedUser = await this.userRepository.save(user);

    const frontendUrl = this.configService.get<string>('app.frontendUrl');
    const magicLink = `${frontendUrl}/verify-magic?token=${verificationToken}`;
    await this.mailService.sendVerificationEmail({
      to: email,
      magicLink,
      jobId: randomUUID(),
    });

    return {
      message: RESPONSE_MESSAGES.USER_REGISTERED,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName || null,
        lastName: savedUser.lastName || null,
        isEmailVerified: savedUser.isEmailVerified,
      },
      verification: {
        sent: true,
        method: VERIFICATION_METHODS.MAGIC,
        expiresIn: 300,
        expiresAt: verificationExpiresAt.toISOString(),
      },
    };
  }

  // SERVICE
  public async loginUser(
    dto: LoginUserDTO,
    deviceName?: string,
    ipAddress?: string,
  ): Promise<{
    sessionId: string;
    user: Omit<User, 'passwordHash'>;
  }> {
    const { email, password } = dto;

    const user = await this.userRepository.findByEmailWithPassword(email, null);
    if (!user) {
      throw new UnauthorizedException(
        RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS,
      );
    }

    const isUserActive = user.isActive;
    if (!isUserActive) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.USER_INACTIVE);
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.passwordHash || '',
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS,
      );
    }

    if (!user.isEmailVerified) {
      const isExpired = user.verificationExpiresAt
        ? new Date() > user.verificationExpiresAt
        : true;
      const resendPath = `/api/${API_ROUTES.AUTH.ROOT}/${API_ROUTES.AUTH.SEND_VERIFICATION}`;
      throw new UnauthorizedException({
        message: RESPONSE_MESSAGES.EMAIL_NOT_VERIFIED,
        data: {
          isExpired,
          options: [
            {
              method: VERIFICATION_METHODS.MAGIC,
              path: resendPath,
              body: { email: user.email, method: VERIFICATION_METHODS.MAGIC },
            },
            {
              method: VERIFICATION_METHODS.OTP,
              path: resendPath,
              body: { email: user.email, method: VERIFICATION_METHODS.OTP },
            },
          ],
        },
      });
    }

    // Limit concurrent sessions to max 5 (Policy B: revoke oldest)
    const maxSessions = 5;
    const activeSessions = await this.sessionRepository.find({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
      order: {
        lastUsedAt: 'ASC', // oldest first
      },
    });

    if (activeSessions.length >= maxSessions) {
      const oldestSession = activeSessions[0];
      oldestSession.status = 'REVOKED';
      oldestSession.revokedAt = new Date();
      await this.sessionRepository.save(oldestSession);
      await this.sessionCacheService.invalidate(oldestSession.id, user.id);
    }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const uaParsed = this.parseUserAgent(deviceName);

    // Create session in database
    const session = this.sessionRepository.create({
      userId: user.id,
      status: 'ACTIVE',
      deviceName: uaParsed.device || null,
      browser: uaParsed.browser || null,
      operatingSystem: uaParsed.os || null,
      ipAddress: ipAddress || null,
      userAgent: deviceName || null, // user agent passed in deviceName
      expiresAt,
    });

    const savedSession = await this.sessionRepository.save(session);

    // Cache the session in Redis
    await this.sessionCacheService.set(savedSession);

    // Strip passwordHash from response
    const { passwordHash: _, ...userResponse } = user;
    Logger.log('User logged in successfully', userResponse);

    return { sessionId: savedSession.id, user: userResponse };
  }

  // SERVICE
  public async logout(sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new UnauthorizedException();
    }

    if (sessionId) {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });
      if (session) {
        session.status = 'REVOKED';
        session.revokedAt = new Date();
        await this.sessionRepository.save(session);
        await this.sessionCacheService.invalidate(sessionId, session.userId);
      }
    }
  }

  // SERVICE
  public async sendVerification(dto: SendVerificationDTO): Promise<{
    message: string;
    email: string;
    type: string;
    method: string;
    expiresIn: number;
    expiresAt: string;
    resendCooldown: number;
  }> {
    const { email, type, method } = dto;

    const user = await this.userRepository.findUserByEmail(email);
    const expiresIn = 300; // 5 minutes in seconds
    const resendCooldown = 60; // 1 minute cooldown
    const verificationExpiresAt = new Date(Date.now() + expiresIn * 1000);

    // Defense against email enumeration: return generic success without revealing non-existent email
    if (!user) {
      return {
        message: 'If an account exists with this email, a verification message has been sent.',
        email,
        type,
        method: method || VERIFICATION_METHODS.OTP,
        expiresIn,
        expiresAt: verificationExpiresAt.toISOString(),
        resendCooldown,
      };
    }

    if (type === VERIFICATION_TYPES.SIGNUP) {
      if (user.isEmailVerified) {
        throw new BadRequestException(RESPONSE_MESSAGES.EMAIL_ALREADY_VERIFIED);
      }

      if (method === VERIFICATION_METHODS.MAGIC) {
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
          type,
          method,
          expiresIn,
          expiresAt: verificationExpiresAt.toISOString(),
          resendCooldown,
        };
      } else {
        const verificationOtp = this.generateSecureOtp();
        const hashedOtp = await bcrypt.hash(verificationOtp, 10);

        // Store hashed OTP in Redis securely
        await this.redisService.set(
          REDIS_KEYS.OTP(email),
          hashedOtp,
          expiresIn,
        );

        // Reset attempt counter
        await this.redisService.del(REDIS_KEYS.OTP_ATTEMPTS(email));

        await this.mailService.sendVerificationEmail({
          to: email,
          otp: verificationOtp,
          jobId: randomUUID(),
        });

        return {
          message: 'Verification OTP code sent successfully to email',
          email,
          type,
          method,
          expiresIn,
          expiresAt: verificationExpiresAt.toISOString(),
          resendCooldown,
        };
      }
    } else if (type === VERIFICATION_TYPES.FORGOT_PASSWORD) {
      if (method === VERIFICATION_METHODS.MAGIC) {
        throw new BadRequestException(
          'Magic link not supported for password reset',
        );
      }

      const resetOtp = this.generateSecureOtp();
      const hashedOtp = await bcrypt.hash(resetOtp, 10);

      await this.redisService.set(
        REDIS_KEYS.PASSWORD_RESET_OTP(email),
        hashedOtp,
        expiresIn,
      );

      // Reset attempt counter
      await this.redisService.del(REDIS_KEYS.OTP_ATTEMPTS(email));

      await this.mailService.sendPasswordResetEmail({
        to: email,
        otp: resetOtp,
      });

      return {
        message: RESPONSE_MESSAGES.AUTH.FORGOT_PASSWORD_SUCCESS,
        email,
        type,
        method: method || VERIFICATION_METHODS.OTP,
        expiresIn,
        expiresAt: verificationExpiresAt.toISOString(),
        resendCooldown,
      };
    }

    throw new BadRequestException(VALIDATION_MESSAGES.TYPE_INVALID('Type'));
  }

  // SERVICE
  public async verify(dto: VerifyDTO): Promise<{
    message: string;
    email?: string;
    type: string;
    method?: string;
    verified: boolean;
    verifiedAt: string;
  }> {
    const { email, code, type, method } = dto;
    const verifiedAt = new Date().toISOString();

    if (type === VERIFICATION_TYPES.SIGNUP) {
      if (method === VERIFICATION_METHODS.MAGIC) {
        const user = await this.userRepository.findOne({
          where: { verificationToken: code },
        });

        if (!user) {
          throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);
        }

        if (
          user.verificationExpiresAt &&
          new Date() > user.verificationExpiresAt
        ) {
          throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_EXPIRED);
        }

        user.isEmailVerified = true;
        user.verificationToken = null;
        user.verificationOtp = null;
        user.verificationExpiresAt = null;

        await this.userRepository.save(user);
        await this.mailService.cleanCompletedJobs();

        return {
          message: RESPONSE_MESSAGES.VERIFICATION_SUCCESS,
          email: user.email,
          type,
          method,
          verified: true,
          verifiedAt,
        };
      } else {
        if (!email)
          throw new BadRequestException(VALIDATION_MESSAGES.REQUIRED('Email'));
        const user = await this.userRepository.findUserByEmail(email);
        if (!user)
          throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);

        const storedHashedOtp = await this.redisService.get(
          REDIS_KEYS.OTP(email),
        );
        if (!storedHashedOtp) {
          throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_EXPIRED);
        }

        // Brute-force protection: Check failed attempts (max 5)
        const attemptsKey = REDIS_KEYS.OTP_ATTEMPTS(email);
        const attempts = parseInt(
          (await this.redisService.get(attemptsKey)) || '0',
          10,
        );

        if (attempts >= 5) {
          await this.redisService.del(REDIS_KEYS.OTP(email));
          await this.redisService.del(attemptsKey);
          throw new BadRequestException(
            'Too many failed attempts. Verification code invalidated. Please request a new code.',
          );
        }

        const isValid = await bcrypt.compare(code, storedHashedOtp);
        if (!isValid) {
          await this.redisService.set(
            attemptsKey,
            (attempts + 1).toString(),
            300,
          );
          throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);
        }

        user.isEmailVerified = true;
        user.verificationToken = null;
        user.verificationOtp = null;
        user.verificationExpiresAt = null;

        await this.userRepository.save(user);
        await this.redisService.del(REDIS_KEYS.OTP(email));
        await this.redisService.del(attemptsKey);

        return {
          message: RESPONSE_MESSAGES.VERIFICATION_SUCCESS,
          email,
          type,
          method,
          verified: true,
          verifiedAt,
        };
      }
    } else if (type === VERIFICATION_TYPES.FORGOT_PASSWORD) {
      if (!email)
        throw new BadRequestException(VALIDATION_MESSAGES.REQUIRED('Email'));
      const user = await this.userRepository.findUserByEmail(email);
      if (!user)
        throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);

      const storedHashedOtp = await this.redisService.get(
        REDIS_KEYS.PASSWORD_RESET_OTP(email),
      );
      if (!storedHashedOtp) {
        throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_EXPIRED);
      }

      // Brute-force protection: Check failed attempts (max 5)
      const attemptsKey = REDIS_KEYS.OTP_ATTEMPTS(email);
      const attempts = parseInt(
        (await this.redisService.get(attemptsKey)) || '0',
        10,
      );

      if (attempts >= 5) {
        await this.redisService.del(REDIS_KEYS.PASSWORD_RESET_OTP(email));
        await this.redisService.del(attemptsKey);
        throw new BadRequestException(
          'Too many failed attempts. Verification code invalidated. Please request a new code.',
        );
      }

      let hashedOtp = storedHashedOtp;
      if (storedHashedOtp.startsWith('{')) {
        try {
          const parsed = JSON.parse(storedHashedOtp);
          hashedOtp = parsed.hashedOtp;
        } catch {}
      }

      const isValid = await bcrypt.compare(code, hashedOtp);
      if (!isValid) {
        await this.redisService.set(
          attemptsKey,
          (attempts + 1).toString(),
          300,
        );
        throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);
      }

      await this.redisService.del(attemptsKey);

      return {
        message: 'Password reset code verified successfully',
        email,
        type,
        method: method || VERIFICATION_METHODS.OTP,
        verified: true,
        verifiedAt,
      };
    }

    throw new BadRequestException(VALIDATION_MESSAGES.TYPE_INVALID('Type'));
  }

  // SERVICE
  public async getActiveSessions(userId: string): Promise<Session[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        status: 'ACTIVE',
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  // SERVICE
  public async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    session.status = 'REVOKED';
    session.revokedAt = new Date();
    await this.sessionRepository.save(session);

    // Invalidate Redis cache
    await this.sessionCacheService.invalidate(sessionId, userId);
  }

  // SERVICE
  public async logoutAll(userId: string): Promise<void> {
    const activeSessions = await this.sessionRepository.find({
      where: { userId, status: 'ACTIVE' },
    });

    for (const s of activeSessions) {
      s.status = 'REVOKED';
      s.revokedAt = new Date();
    }
    await this.sessionRepository.save(activeSessions);

    // Invalidate Redis cache
    await this.sessionCacheService.invalidateAllForUser(userId);
  }

  // SERVICE — Session bootstrap (GET /auth/me)
  public async getMe(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN);
    }
    const { passwordHash: _, ...userResponse } = user;
    return userResponse;
  }

  // SERVICE — CSRF token generation
  public async generateCsrfToken(userId: string): Promise<string> {
    const token = randomUUID();
    // Store in Redis with 1-hour TTL, keyed by userId
    await this.redisService.set(REDIS_KEYS.CSRF(userId), token, 3600);
    return token;
  }

  // SERVICE — CSRF token validation
  public async validateCsrfToken(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const stored = await this.redisService.get(REDIS_KEYS.CSRF(userId));
    return stored === token;
  }

  // SERVICE — Unified Password Management (Reset via OTP OR Change via Current Password)
  public async resetPassword(
    dto: UpdatePasswordDTO,
    currentUserSub?: string,
  ): Promise<{ message: string; updatedAt: string }> {
    const { mode, email, code, currentPassword, newPassword } = dto;
    const updatedAt = new Date().toISOString();

    // Mode 1: Change Password (In-App Authenticated Settings Flow)
    if (mode === 'change') {
      if (!currentUserSub) {
        throw new UnauthorizedException(
          'Authentication required to change password',
        );
      }

      if (!currentPassword) {
        throw new BadRequestException('Current password is required');
      }

      const user = await this.userRepository.findByIdWithPassword(currentUserSub);
      if (!user) {
        throw new NotFoundException(RESPONSE_MESSAGES.USER_NOT_FOUND);
      }

      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.passwordHash || '',
      );
      if (!isPasswordValid) {
        throw new UnauthorizedException('Current password is incorrect');
      }

      if (currentPassword === newPassword) {
        throw new BadRequestException(
          'New password must be different from current password',
        );
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      await this.userRepository.update({ id: user.id }, { passwordHash });

      return {
        message: 'Password updated successfully',
        updatedAt,
      };
    }

    // Mode 2: Forgot Password Reset (Unauthenticated OTP Flow)
    if (mode === 'forgot') {
      if (!email || !code) {
        throw new BadRequestException(
          'Email and verification code are required for password reset',
        );
      }

      const user = await this.userRepository.findUserByEmail(email);
      if (!user) {
        throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);
      }

      const storedHashedOtp = await this.redisService.get(
        REDIS_KEYS.PASSWORD_RESET_OTP(email),
      );

      if (!storedHashedOtp) {
        throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_EXPIRED);
      }

      // Check failed attempts (max 5)
      const attemptsKey = REDIS_KEYS.OTP_ATTEMPTS(email);
      const attempts = parseInt(
        (await this.redisService.get(attemptsKey)) || '0',
        10,
      );

      if (attempts >= 5) {
        await this.redisService.del(REDIS_KEYS.PASSWORD_RESET_OTP(email));
        await this.redisService.del(attemptsKey);
        throw new BadRequestException(
          'Too many failed attempts. Verification code invalidated. Please request a new code.',
        );
      }

      let hashedOtp = storedHashedOtp;
      if (storedHashedOtp.startsWith('{')) {
        try {
          const parsed = JSON.parse(storedHashedOtp);
          hashedOtp = parsed.hashedOtp;
        } catch {}
      }

      const isValid = await bcrypt.compare(code, hashedOtp);
      if (!isValid) {
        await this.redisService.set(
          attemptsKey,
          (attempts + 1).toString(),
          300,
        );
        throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);
      }

      // Update password explicitly using update query
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      await this.userRepository.update({ id: user.id }, { passwordHash });

      // Clean up Redis keys
      await this.redisService.del(REDIS_KEYS.PASSWORD_RESET_OTP(email));
      await this.redisService.del(attemptsKey);

      // Revoke all active sessions for security
      await this.logoutAll(user.id);

      return {
        message: 'Password reset successfully. Please log in with your new password.',
        updatedAt,
      };
    }

    throw new BadRequestException(
      'Invalid mode. Mode must be either "forgot" or "change"',
    );
  }

  public async getSessionById(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findOne({ where: { id: sessionId } });
  }

  // HELPER — HttpOnly cookie options for session
  public getSessionCookieOptions(maxAge?: number) {
    return {
      httpOnly: true,
      secure: true, // Required by Chrome for SameSite=None even on localhost
      sameSite: 'none' as const,
      path: '/',
      maxAge: maxAge ?? 60 * 60 * 1000, // 1 hour in ms
    };
  }
}
