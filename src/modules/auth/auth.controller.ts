import {
  Controller,
  Post,
  Body,
  Get,
  Query,
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
import { VerifyOtpDTO } from './dto/verifyOtp.dto';
import { ResendVerificationDTO } from './dto/resendVerification.dto';
import { API_PATHS } from '../../core/constants/paths';
import { ResponseMessage } from '../../core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from '../../core/constants/messages';
import { SessionGuard } from '../../core/guards/session.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import type { Request, Response } from 'express';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';

const SESSION_COOKIE_NAME = 'pulseboard_session';

export interface SessionPayload {
  sub: string;
  sid: string;
}

@Controller(API_PATHS.AUTH.ROOT)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @Post(API_PATHS.AUTH.REGISTER)
  @ResponseMessage(RESPONSE_MESSAGES.USER_REGISTERED)
  public async register(@Body() dto: RegisterUserDTO) {
    const user = await this.authService.registerUser(dto);
    return { user };
  }

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
  @Post(API_PATHS.AUTH.LOGIN)
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

  @Post(API_PATHS.AUTH.LOGOUT)
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
    return true;
  }

  @Get(API_PATHS.AUTH.ME)
  @UseGuards(SessionGuard)
  @ResponseMessage('Session retrieved successfully')
  public async getMe(@CurrentUser() user: SessionPayload) {
    return this.authService.getMe(user.sub);
  }

  @Get(API_PATHS.AUTH.CSRF_TOKEN)
  @UseGuards(SessionGuard)
  @ResponseMessage('CSRF token generated')
  public async getCsrfToken(@CurrentUser() user: SessionPayload) {
    const token = await this.authService.generateCsrfToken(user.sub);
    return { csrfToken: token };
  }

  @Get(API_PATHS.AUTH.VERIFY_MAGIC)
  @ResponseMessage(RESPONSE_MESSAGES.VERIFICATION_SUCCESS)
  public async verifyMagic(@Query('token') token: string) {
    return this.authService.verifyMagic(token);
  }

  @Post(API_PATHS.AUTH.VERIFY_OTP)
  @ResponseMessage(RESPONSE_MESSAGES.VERIFICATION_SUCCESS)
  public async verifyOtp(@Body() dto: VerifyOtpDTO) {
    return this.authService.verifyOtp(dto);
  }

  @Post(API_PATHS.AUTH.RESEND_VERIFICATION)
  @ResponseMessage(RESPONSE_MESSAGES.RESEND_SUCCESS)
  public async resendVerification(@Body() dto: ResendVerificationDTO) {
    return this.authService.resendVerification(dto);
  }

  @Get(API_PATHS.AUTH.SESSIONS)
  @UseGuards(SessionGuard)
  @ResponseMessage('Active sessions retrieved successfully')
  public async getSessions(@CurrentUser() user: SessionPayload) {
    return this.authService.getActiveSessions(user.sub);
  }

  @Delete(`${API_PATHS.AUTH.SESSIONS}/:id`)
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
