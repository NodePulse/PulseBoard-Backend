import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  Delete,
  Param,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiEndpoint } from '../../core/decorators/api-endpoint.decorator';
import { RegisterUserDTO } from './dto/registerUser.dto';
import { LoginUserDTO } from './dto/loginUser.dto';
import { SendVerificationDTO } from './dto/sendVerification.dto';
import { VerifyDTO } from './dto/verify.dto';
import { UpdatePasswordDTO } from './dto/updatePassword.dto';
import { API_ROUTES } from '../../core/constants/routes';
import { ResponseMessage } from '../../core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from '../../core/constants/messages';
import { SessionGuard } from '../../core/guards/session.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import type { Request, Response } from 'express';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import {
  Throttle,
  ThrottlerGuard,
  ThrottlerLimitDetail,
} from '@nestjs/throttler';
import {
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Injectable()
export class ForgotPasswordThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // throttle per email+IP combo so one victim's email can't be hammered from many IPs alone
    const email = req.body?.email?.toLowerCase()?.trim() ?? 'unknown';
    return `${req.ip}-${email}`;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: ThrottlerLimitDetail,
  ): Promise<void> {
    const seconds = throttlerLimitDetail.timeToExpire % 60;
    const minutes = Math.floor(throttlerLimitDetail.timeToExpire / 60);
    throw new HttpException(
      `You have exceeded the maximum number of attempts. Please try again after ${
        minutes ? minutes + ' minutes ' : ''
      } ${seconds ? seconds + ' seconds' : ''}`,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

const SESSION_COOKIE_NAME = 'pulseboard_session';

export interface SessionPayload {
  sub: string;
  sid: string;
}

@Controller(API_ROUTES.AUTH.ROOT)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // CONTROLLER
  @ApiTags('Authentication')
  @ApiOperation({
    summary: 'Register a new user',
    description: 'Registers a new user with the provided details',
  })
  @ApiBody({ type: RegisterUserDTO })
  @ApiEndpoint({
    201: {
      type: { user: User },
      message: RESPONSE_MESSAGES.USER_REGISTERED,
    },
    400: RESPONSE_MESSAGES.AUTH.VALIDATION_ERROR,
    409: RESPONSE_MESSAGES.CONFLICT_EMAIL,
  })
  @Post(API_ROUTES.AUTH.REGISTER)
  public async register(@Body() dto: RegisterUserDTO) {
    return this.authService.registerUser(dto);
  }

  // CONTROLLER
  @ApiTags('Authentication')
  @ApiOperation({
    summary: 'Login with email and password',
    description:
      'Authenticates a user and starts a session. On success, a session ID is set as an ' +
      'httpOnly cookie — the frontend does not need to store or send any token manually; ' +
      'the browser will include the cookie automatically on subsequent requests. ' +
      'The response body only contains the user profile, not the session token.',
  })
  @ApiBody({ type: LoginUserDTO })
  @ApiEndpoint({
    201: {
      type: { user: User },
      message: RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS,
    },
    400: RESPONSE_MESSAGES.AUTH.VALIDATION_ERROR,
    401: RESPONSE_MESSAGES.AUTH.INVALID_CREDENTIALS,
    403: RESPONSE_MESSAGES.AUTH.FORBIDDEN,
    429: RESPONSE_MESSAGES.AUTH.TOO_MANY_REQUESTS,
  })
  @Post(API_ROUTES.AUTH.LOGIN)
  @ResponseMessage(RESPONSE_MESSAGES.AUTH.LOGIN_SUCCESS)
  public async login(
    @Body() dto: LoginUserDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceName = req.headers['user-agent'];
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const { sessionId, user } = await this.authService.loginUser(
      dto,
      deviceName,
      ipAddress,
    );

    res.cookie(
      SESSION_COOKIE_NAME,
      sessionId,
      this.authService.getSessionCookieOptions(),
    );

    return { user };
  }

  // CONTROLLER
  @ApiTags('Authentication')
  @ApiOperation({
    summary: 'Logout a user',
    description: 'Logout a user',
  })
  @ApiEndpoint({
    201: {
      type: { user: User },
      message: RESPONSE_MESSAGES.LOGOUT_SUCCESS,
    },
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Post(API_ROUTES.AUTH.LOGOUT)
  @UseGuards(SessionGuard)
  @HttpCode(200)
  @ResponseMessage(RESPONSE_MESSAGES.LOGOUT_SUCCESS)
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (sessionId) {
      await this.authService.logout(sessionId);
    }

    res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
    return { loggedOut: true };
  }

  // CONTROLLER
  @ApiTags('Authentication')
  @ApiOperation({
    summary: 'Get current user information',
    description: 'Get current user information',
  })
  @ApiEndpoint({
    200: {
      type: { user: User },
      message: 'Session retrieved successfully',
    },
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Get(API_ROUTES.AUTH.ME)
  @UseGuards(SessionGuard)
  @ResponseMessage('Session retrieved successfully')
  public async getMe(@CurrentUser() user: SessionPayload) {
    const userProfile = await this.authService.getMe(user.sub);
    return { user: userProfile };
  }

  // CONTROLLER
  @ApiTags('Authentication')
  @ApiOperation({
    summary: 'Generate CSRF token',
    description: 'Generate CSRF token',
  })
  @ApiEndpoint({
    201: {
      type: { csrfToken: String },
      message: 'CSRF token generated',
    },
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Get(API_ROUTES.AUTH.CSRF_TOKEN)
  @UseGuards(SessionGuard)
  @ResponseMessage('CSRF token generated')
  public async getCsrfToken(@CurrentUser() user: SessionPayload) {
    const token = await this.authService.generateCsrfToken(user.sub);
    return { csrfToken: token };
  }

  // CONTROLLER
  @ApiTags('Authentication')
  @ApiOperation({
    summary: 'Send Verification (OTP or Magic Link)',
    description: 'Send verification for Signup or Forgot Password',
  })
  @ApiEndpoint({
    200: {
      type: { message: String },
      message: RESPONSE_MESSAGES.RESEND_SUCCESS,
    },
    400: RESPONSE_MESSAGES.AUTH.VALIDATION_ERROR,
    404: RESPONSE_MESSAGES.USER_NOT_FOUND,
  })
  @Post(API_ROUTES.AUTH.SEND_VERIFICATION)
  @UseGuards(ForgotPasswordThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  public async sendVerification(@Body() dto: SendVerificationDTO) {
    return this.authService.sendVerification(dto);
  }

  // CONTROLLER
  @ApiTags('Authentication')
  @ApiOperation({
    summary: 'Verify Code (OTP or Magic Link Token)',
    description: 'Verify code for Signup or Forgot Password',
  })
  @ApiEndpoint({
    200: {
      type: { message: String },
      message: RESPONSE_MESSAGES.VERIFICATION_SUCCESS,
    },
    400: RESPONSE_MESSAGES.VERIFICATION_INVALID,
  })
  @Post(API_ROUTES.AUTH.VERIFY)
  public async verify(@Body() dto: VerifyDTO) {
    return this.authService.verify(dto);
  }

  // CONTROLLER
  @ApiTags('Authentication')
  @ApiOperation({
    summary: 'Update / Reset Password',
    description:
      'Unified password management endpoint. Supports two scenarios:\n' +
      '1. Forgot Password Reset (Unauthenticated): Provide { email, code, newPassword }\n' +
      '2. In-App Password Change (Authenticated): Provide { currentPassword, newPassword }',
  })
  @ApiBody({ type: UpdatePasswordDTO })
  @ApiEndpoint({
    200: {
      type: { message: String },
      message: 'Password updated successfully',
    },
    400: RESPONSE_MESSAGES.AUTH.VALIDATION_ERROR,
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Post(API_ROUTES.AUTH.RESET_PASSWORD)
  @UseGuards(ForgotPasswordThrottlerGuard)
  @Throttle({ default: { limit: 3, ttl: 900000 } })
  public async resetPassword(
    @Body() dto: UpdatePasswordDTO,
    @Req() req: Request,
  ) {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    let currentUserSub: string | undefined = undefined;

    if (sessionId) {
      const session = await this.authService.getSessionById(sessionId);
      if (session && session.status === 'ACTIVE') {
        currentUserSub = session.userId;
      }
    }

    return this.authService.resetPassword(dto, currentUserSub);
  }

  // CONTROLLER
  @ApiTags('Authentication')
  @ApiOperation({
    summary: 'Get active sessions',
    description: 'Get active sessions',
  })
  @ApiEndpoint({
    200: {
      type: { sessions: User },
      message: 'Active sessions retrieved successfully',
    },
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Get(API_ROUTES.AUTH.SESSIONS)
  @UseGuards(SessionGuard)
  @ResponseMessage('Active sessions retrieved successfully')
  public async getSessions(@CurrentUser() user: SessionPayload) {
    return this.authService.getActiveSessions(user.sub);
  }

  // CONTROLLER
  @ApiTags('Authentication')
  @ApiOperation({
    summary: 'Revoke session',
    description: 'Revoke session',
  })
  @ApiEndpoint({
    200: {
      type: { user: User },
      message: RESPONSE_MESSAGES.SESSION_REVOKED,
    },
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Delete(`${API_ROUTES.AUTH.SESSIONS}/:id`)
  @UseGuards(SessionGuard)
  @ResponseMessage(RESPONSE_MESSAGES.SESSION_REVOKED)
  public async revokeSession(
    @CurrentUser() user: SessionPayload,
    @Param('id') id: string,
  ) {
    await this.authService.revokeSession(user.sub, id);
    return true;
  }
}
