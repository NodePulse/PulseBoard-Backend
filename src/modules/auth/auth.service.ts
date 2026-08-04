import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { User, UserPlan } from '../users/entities/user.entity';
import { RefreshTokenSession } from './entities/refresh-token-session.entity';
import { RegisterUserDTO } from './dto/registerUser.dto';
import { LoginUserDTO } from './dto/loginUser.dto';
import { VerifyOtpDTO } from './dto/verifyOtp.dto';
import { ResendVerificationDTO } from './dto/resendVerification.dto';
import { RefreshTokenDTO } from './dto/refreshToken.dto';
import * as bcrypt from 'bcrypt';
import {
  RESPONSE_MESSAGES,
  VERIFICATION_METHODS,
} from '../../core/constants/messages';
import { API_PATHS } from '../../core/constants/paths';
import { UserRepository } from '../users/repositories/user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID, randomBytes, createHash } from 'crypto';
import { RedisService } from 'src/core/redis/redis.service';
import { MailService } from 'src/core/mail/mail.service';
import { SessionCacheService } from '../session/session-cache.service';

export interface JwtPayload {
  sub: string;
  email: string;
  jti: string;
  familyId?: string;
  exp?: number;
  iat?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectRepository(RefreshTokenSession)
    private readonly sessionRepository: Repository<RefreshTokenSession>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly mailService: MailService,
    private readonly sessionCacheService: SessionCacheService,
  ) {}

  // FUNC
  private async signAccessToken(
    userId: string,
    sessionId: string,
    email: string,
  ): Promise<string> {
    const accessTokenJti = randomUUID();
    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const accessExpiresIn = this.configService.get<string>(
      'jwt.accessTokenExpiresIn',
    );

    return this.jwtService.signAsync(
      { sub: userId, email, sid: sessionId, jti: accessTokenJti },
      { secret: accessSecret, expiresIn: accessExpiresIn as unknown as number },
    );
  }

  // FUNC
  private generateRefreshToken() {
    const token = randomBytes(48).toString('base64url');
    const hash = createHash('sha256').update(token).digest('hex');
    return { token, hash };
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
      plan: UserPlan.FREE,
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
    accessToken: string;
    refreshToken: string;
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

    // Generate opaque refresh token and its hash
    const { token: refreshToken, hash: refreshTokenHash } =
      this.generateRefreshToken();
    const familyId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const uaParsed = this.parseUserAgent(deviceName);

    // Create session in database
    const session = this.sessionRepository.create({
      userId: user.id,
      refreshTokenHash,
      familyId,
      status: 'ACTIVE',
      deviceName: uaParsed.device || null,
      browser: uaParsed.browser || null,
      operatingSystem: uaParsed.os || null,
      ipAddress: ipAddress || null,
      userAgent: deviceName || null, // user agent passed in deviceName
      expiresAt,
    });

    const savedSession = await this.sessionRepository.save(session);

    // Sign access token with session ID (sid)
    const accessToken = await this.signAccessToken(
      user.id,
      savedSession.id,
      user.email,
    );

    // Cache the session in Redis
    await this.sessionCacheService.set(savedSession);

    // Strip passwordHash from response
    const { passwordHash, ...userResponse } = user;

    return { accessToken, refreshToken, user: userResponse };
  }

  // SERVICE
  public async refreshTokens(
    dto: RefreshTokenDTO,
    deviceName?: string,
    ipAddress?: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: Omit<User, 'passwordHash'>;
  }> {
    const { refreshToken } = dto;
    const hash = createHash('sha256').update(refreshToken).digest('hex');
    const lockKey = `refresh_lock:${hash}`;

    // Acquire lock (3 seconds)
    const locked = await this.redisService.client.set(
      lockKey,
      '1',
      'PX',
      3000,
      'NX',
    );
    if (!locked) {
      throw new ConflictException('Refresh already in progress');
    }

    try {
      const session = await this.sessionRepository.findOne({
        where: { refreshTokenHash: hash },
      });

      if (!session) {
        // Reuse detection: check if this token was recently rotated
        const reusedSessionId = await this.redisService.client.get(
          `used_token:${hash}`,
        );
        if (reusedSessionId) {
          // REUSE DETECTED -> Defensively revoke all sessions in the family
          const reusedSession = await this.sessionRepository.findOne({
            where: { id: reusedSessionId },
          });
          if (reusedSession) {
            const familySessions = await this.sessionRepository.find({
              where: { familyId: reusedSession.familyId },
            });
            for (const s of familySessions) {
              s.status = 'REVOKED';
              s.revokedAt = new Date();
            }
            await this.sessionRepository.save(familySessions);
            for (const s of familySessions) {
              await this.sessionCacheService.invalidate(s.id, s.userId);
            }
          }
          throw new UnauthorizedException(
            'Session compromised. Please log in again.',
          );
        }
        throw new UnauthorizedException(RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN);
      }

      if (session.status !== 'ACTIVE' || session.expiresAt < new Date()) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN);
      }

      // Rotate: generate new refresh token
      const { token: newRefresh, hash: newHash } = this.generateRefreshToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Store current token in Redis as "used" for reuse detection (valid for 60 seconds)
      await this.redisService.client.set(
        `used_token:${hash}`,
        session.id,
        'EX',
        60,
      );

      // Update database session record
      session.refreshTokenHash = newHash;
      session.expiresAt = expiresAt;
      session.lastUsedAt = new Date();
      if (deviceName) {
        const uaParsed = this.parseUserAgent(deviceName);
        session.deviceName = uaParsed.device || null;
        session.browser = uaParsed.browser || null;
        session.operatingSystem = uaParsed.os || null;
        session.userAgent = deviceName;
      }
      if (ipAddress) {
        session.ipAddress = ipAddress;
      }

      const updatedSession = await this.sessionRepository.save(session);

      // Update cache
      await this.sessionCacheService.set(updatedSession);

      const user = await this.userRepository.findOne({
        where: { id: session.userId },
      });
      if (!user) {
        throw new UnauthorizedException(RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN);
      }

      // Sign access token with new jti, same sid
      const accessToken = await this.signAccessToken(
        user.id,
        session.id,
        user.email,
      );

      const { passwordHash, ...userResponse } = user;

      return {
        accessToken,
        refreshToken: newRefresh,
        user: userResponse,
      };
    } finally {
      // Release lock
      await this.redisService.client.del(lockKey);
    }
  }

  // SERVICE
  public async logout(
    accessToken: string,
    refreshToken?: string,
  ): Promise<void> {
    let sessionId: string | undefined;
    let userId: string | undefined;

    try {
      const accessPayload = await this.jwtService.verifyAsync<JwtPayload>(
        accessToken,
        {
          secret: this.configService.get<string>('jwt.accessSecret'),
          ignoreExpiration: true,
        },
      );
      sessionId = (accessPayload as any).sid;
      userId = accessPayload.sub;
    } catch (err) {
      // Ignore verify error
    }

    if (sessionId && userId) {
      const session = await this.sessionRepository.findOne({
        where: { id: sessionId },
      });
      if (session) {
        session.status = 'REVOKED';
        session.revokedAt = new Date();
        await this.sessionRepository.save(session);
        await this.sessionCacheService.invalidate(sessionId, userId);
      }
    }

    if (refreshToken) {
      try {
        const hash = createHash('sha256').update(refreshToken).digest('hex');
        const session = await this.sessionRepository.findOne({
          where: { refreshTokenHash: hash },
        });
        if (session) {
          session.status = 'REVOKED';
          session.revokedAt = new Date();
          await this.sessionRepository.save(session);
          await this.sessionCacheService.invalidate(session.id, session.userId);
        }
      } catch (err) {
        // Ignore errors
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
  public async getActiveSessions(
    userId: string,
  ): Promise<RefreshTokenSession[]> {
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
}
