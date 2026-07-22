import { Injectable, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
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
import { RESPONSE_MESSAGES, VERIFICATION_METHODS } from '../../core/constants/messages';
import { API_PATHS } from '../../core/constants/paths';
import { UserRepository } from '../users/repositories/user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { RedisService } from 'src/core/redis/redis.service';
import { MailService } from 'src/core/mail/mail.service';

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
  ) { }

  // FUNC
  private async generateTokens(user: User, familyId?: string) {
    const accessTokenJti = randomUUID();
    const refreshTokenJti = randomUUID();
    const finalFamilyId = familyId || randomUUID();

    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const refreshSecret = this.configService.get<string>('jwt.refreshSecret');
    const accessExpiresIn = this.configService.get<string>('jwt.accessTokenExpiresIn');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshTokenExpiresIn');

    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, jti: accessTokenJti },
      { secret: accessSecret, expiresIn: accessExpiresIn as unknown as number },
    );

    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, jti: refreshTokenJti, familyId: finalFamilyId },
      { secret: refreshSecret, expiresIn: refreshExpiresIn as unknown as number },
    );

    return { accessToken, refreshToken, accessTokenJti, refreshTokenJti, familyId: finalFamilyId };
  }

  // FUNC
  private async createSession(
    userId: string,
    jti: string,
    familyId: string,
    expiresAt: Date,
    deviceName?: string,
    ipAddress?: string,
  ) {
    const session = this.sessionRepository.create({
      userId,
      jti,
      familyId,
      expiresAt,
      deviceName: deviceName || null,
      ipAddress: ipAddress || null,
      revokedAt: null,
    });
    return this.sessionRepository.save(session);
  }

  // SERVICE
  public async registerUser(dto: RegisterUserDTO): Promise<User> {
    const { email, firstName, lastName, password } = dto;

    const existingUser = await this.userRepository.findByEmailAndTenant(email, null);
    if (existingUser) {
      throw new ConflictException(RESPONSE_MESSAGES.CONFLICT_EMAIL);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const verificationToken = randomUUID();
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
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
      verificationOtp,
      verificationExpiresAt,
    });

    const savedUser = await this.userRepository.save(user);

    const magicLink = `http://localhost:5000/api/${API_PATHS.AUTH.ROOT}/${API_PATHS.AUTH.VERIFY_MAGIC}?token=${verificationToken}`;
    await this.mailService.sendVerificationEmail({
      to: email,
      magicLink,
      otp: verificationOtp,
    });

    return savedUser;
  }

  // SERVICE
  public async loginUser(
    dto: LoginUserDTO,
    deviceName?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: Omit<User, 'passwordHash'> }> {
    const { email, password } = dto;

    const user = await this.userRepository.findByEmailWithPassword(email, null);
    if (!user) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash || '');
    if (!isPasswordValid) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isEmailVerified) {
      const isExpired = user.verificationExpiresAt ? new Date() > user.verificationExpiresAt : true;
      const resendPath = `/api/${API_PATHS.AUTH.ROOT}/${API_PATHS.AUTH.RESEND_VERIFICATION}`;
      throw new UnauthorizedException({
        message: RESPONSE_MESSAGES.EMAIL_NOT_VERIFIED,
        data: {
          isExpired,
          options: [
            {
              method: VERIFICATION_METHODS.MAGIC,
              path: resendPath,
              body: { email: user.email, method: VERIFICATION_METHODS.MAGIC }
            },
            {
              method: VERIFICATION_METHODS.OTP,
              path: resendPath,
              body: { email: user.email, method: VERIFICATION_METHODS.OTP }
            }
          ]
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken, refreshTokenJti, familyId } = await this.generateTokens(user);

    // Calculate refresh token expiry date (7 days)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Create session in database
    await this.createSession(user.id, refreshTokenJti, familyId, expiresAt, deviceName, ipAddress);

    // Strip passwordHash from response
    const { passwordHash, ...userResponse } = user;

    return { accessToken, refreshToken, user: userResponse };
  }

  // SERVICE
  public async refreshTokens(
    dto: RefreshTokenDTO,
    deviceName?: string,
    ipAddress?: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = dto;

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
      });
    } catch (err) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN);
    }


    const session = await this.sessionRepository.findOne({
      where: { jti: payload.jti },
    });

    // Reuse detection / revocation
    if (!session || session.revokedAt !== null) {
      if (session) {
        const sessionsToRevoke = await this.sessionRepository.find({
          where: { familyId: session.familyId },
        });
        for (const s of sessionsToRevoke) {
          s.revokedAt = new Date();
        }
        await this.sessionRepository.save(sessionsToRevoke);
      }
      throw new UnauthorizedException(RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN);
    }

    // Mark old session as revoked
    session.revokedAt = new Date();
    await this.sessionRepository.save(session);


    // Find the user
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException(RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN);
    }

    // Generate new tokens under the same familyId
    const tokens = await this.generateTokens(user, session.familyId);

    // Create a new session in database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.createSession(user.id, tokens.refreshTokenJti, tokens.familyId, expiresAt, deviceName, ipAddress);

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  // SERVICE
  public async logout(accessToken: string, refreshToken?: string): Promise<void> {
    // 1. Blacklist access token
    try {
      const accessPayload = await this.jwtService.verifyAsync<JwtPayload>(accessToken, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        ignoreExpiration: true,
      });
      const accessTtl = Math.max(0, Math.floor(((accessPayload.exp || 0) * 1000 - Date.now()) / 1000));
      if (accessTtl > 0) {
        await this.redisService.set(`blacklist:${accessPayload.jti}`, 'logout', accessTtl);
      }
    } catch (err) {
      // Ignore invalid access token
    }

    // 2. Blacklist refresh token and revoke database session
    if (refreshToken) {
      try {
        const refreshPayload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
          secret: this.configService.get<string>('jwt.refreshSecret'),
          ignoreExpiration: true,
        });

        // Revoke in database
        await this.sessionRepository.update(
          { jti: refreshPayload.jti },
          { revokedAt: new Date() },
        );

      } catch (err) {
        // Ignore invalid refresh token
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

    return { message: RESPONSE_MESSAGES.VERIFICATION_SUCCESS };
  }

  // SERVICE
  public async verifyOtp(dto: VerifyOtpDTO): Promise<{ message: string }> {
    const { email, otp } = dto;

    const user = await this.userRepository.findByEmailAndTenant(email, null);
    if (!user || user.verificationOtp !== otp) {
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

    return { message: RESPONSE_MESSAGES.VERIFICATION_SUCCESS };
  }

  // SERVICE
  public async resendVerification(dto: ResendVerificationDTO): Promise<{ message: string }> {
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
      magicLink = `http://localhost:5000/api/${API_PATHS.AUTH.ROOT}/${API_PATHS.AUTH.VERIFY_MAGIC}?token=${verificationToken}`;
    } else {
      const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationOtp = verificationOtp;
      user.verificationToken = null;
      otp = verificationOtp;
    }

    await this.mailService.sendVerificationEmail({
      to: email,
      magicLink,
      otp,
    });

    user.verificationExpiresAt = verificationExpiresAt;
    await this.userRepository.save(user);

    return { message: RESPONSE_MESSAGES.RESEND_SUCCESS };
  }

  // SERVICE
  public async getActiveSessions(userId: string): Promise<RefreshTokenSession[]> {
    return this.sessionRepository.find({
      where: {
        userId,
        revokedAt: IsNull(),
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

    session.revokedAt = new Date();
    await this.sessionRepository.save(session);

    // Also blacklist the jti in Redis (set a default TTL of 7 days)
    await this.redisService.set(`blacklist:${session.jti}`, 'revoked', 7 * 24 * 60 * 60);
  }
}
