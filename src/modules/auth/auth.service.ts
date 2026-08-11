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
import { VerifyOtpDTO } from './dto/verifyOtp.dto';
import { ResendVerificationDTO } from './dto/resendVerification.dto';
import * as bcrypt from 'bcrypt';
import {
  RESPONSE_MESSAGES,
  VERIFICATION_METHODS,
} from '../../core/constants/messages';
import { API_PATHS } from '../../core/constants/paths';
import { UserRepository } from '../users/repositories/user.repository';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
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
  public async registerUser(dto: RegisterUserDTO): Promise<User> {
    const { email, firstName, lastName, password } = dto;

    const existingUser = await this.userRepository.findByEmailAndTenant(
      email,
      null,
    );
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

    return savedUser;
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
      throw new UnauthorizedException(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
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
      throw new UnauthorizedException(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isEmailVerified) {
      const isExpired = user.verificationExpiresAt
        ? new Date() > user.verificationExpiresAt
        : true;
      const resendPath = `/api/${API_PATHS.AUTH.ROOT}/${API_PATHS.AUTH.RESEND_VERIFICATION}`;
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
    const { passwordHash, ...userResponse } = user;
    Logger.log('User logged in successfully', userResponse);

    return { sessionId: savedSession.id, user: userResponse };
  }

  // SERVICE
  public async logout(sessionId: string): Promise<void> {
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
  public async verifyMagic(token: string): Promise<{ message: string }> {
    if (!token) {
      throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);
    }

    const user = await this.userRepository.findOne({
      where: { verificationToken: token },
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

    // Immediately prune completed mail jobs from the queue to clean it up
    await this.mailService.cleanCompletedJobs();

    return { message: RESPONSE_MESSAGES.VERIFICATION_SUCCESS };
  }

  // SERVICE
  public async verifyOtp(dto: VerifyOtpDTO): Promise<{ message: string }> {
    const { email, otp } = dto;

    const user = await this.userRepository.findByEmailAndTenant(email, null);
    if (!user) {
      throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);
    }

    const storedOtp = await this.redisService.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException(RESPONSE_MESSAGES.VERIFICATION_INVALID);
    }

    user.isEmailVerified = true;
    user.verificationToken = null;
    user.verificationOtp = null;
    user.verificationExpiresAt = null;

    await this.userRepository.save(user);
    await this.redisService.del(`otp:${email}`);

    return { message: RESPONSE_MESSAGES.VERIFICATION_SUCCESS };
  }

  // SERVICE
  public async resendVerification(
    dto: ResendVerificationDTO,
  ): Promise<{ message: string }> {
    const { email, method } = dto;

    const user = await this.userRepository.findByEmailAndTenant(email, null);
    if (!user) {
      throw new NotFoundException(RESPONSE_MESSAGES.USER_NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new BadRequestException(RESPONSE_MESSAGES.EMAIL_ALREADY_VERIFIED);
    }

    const verificationExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    let magicLink: string | undefined;
    let otp: string | undefined;

    if (method === VERIFICATION_METHODS.MAGIC) {
      const verificationToken = randomUUID();
      user.verificationToken = verificationToken;
      user.verificationOtp = null;
      const frontendUrl = this.configService.get<string>('app.frontendUrl');
      magicLink = `${frontendUrl}/verify-magic?token=${verificationToken}`;

      await this.mailService.sendVerificationEmail({
        to: email,
        magicLink,
        jobId: randomUUID(),
      });

      user.verificationExpiresAt = verificationExpiresAt;
      await this.userRepository.save(user);
    } else {
      const verificationOtp = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();
      await this.redisService.set(`otp:${email}`, verificationOtp, 300); // 5 minutes TTL
    }

    return { message: RESPONSE_MESSAGES.RESEND_SUCCESS };
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
    const { passwordHash, ...userResponse } = user;
    return userResponse;
  }

  // SERVICE — CSRF token generation
  public async generateCsrfToken(userId: string): Promise<string> {
    const token = randomUUID();
    // Store in Redis with 1-hour TTL, keyed by userId
    await this.redisService.set(`csrf:${userId}`, token, 3600);
    return token;
  }

  // SERVICE — CSRF token validation
  public async validateCsrfToken(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const stored = await this.redisService.get(`csrf:${userId}`);
    return stored === token;
  }

  // HELPER — HttpOnly cookie options for session
  public getSessionCookieOptions(maxAge?: number) {
    return {
      httpOnly: true,
      secure: this.configService.get<string>('app.env') === 'production',
      sameSite: 'strict' as const,
      path: '/',
      maxAge: maxAge ?? 60 * 60 * 1000, // 1 hour in ms
    };
  }
}
