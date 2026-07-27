import { Controller, Post, Body, Get, Query, UseGuards, Req, Res, Delete, Param, HttpCode, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { JwtPayload } from './auth.service';
import { RegisterUserDTO } from './dto/registerUser.dto';
import { LoginUserDTO } from './dto/loginUser.dto';
import { VerifyOtpDTO } from './dto/verifyOtp.dto';
import { ResendVerificationDTO } from './dto/resendVerification.dto';
import { API_PATHS } from '../../core/constants/paths';
import { ResponseMessage } from '../../core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from '../../core/constants/messages';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import type { Request, Response } from 'express';

const REFRESH_COOKIE_NAME = 'pulseboard_rt';

@Controller(API_PATHS.AUTH.ROOT)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post(API_PATHS.AUTH.REGISTER)
  @ResponseMessage(RESPONSE_MESSAGES.USER_REGISTERED)
  public async register(@Body() dto: RegisterUserDTO) {
    return this.authService.registerUser(dto);
  }

  @Post(API_PATHS.AUTH.LOGIN)
  @ResponseMessage('Login successful')
  public async login(
    @Body() dto: LoginUserDTO,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceName = req.headers['user-agent'];
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const result = await this.authService.loginUser(dto, deviceName, ipAddress);

    // Set refresh token as httpOnly cookie — JS cannot access it
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, this.authService.getRefreshCookieOptions());

    // Return only accessToken + user in the body (no refreshToken exposed to JS)
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post(API_PATHS.AUTH.REFRESH)
  @HttpCode(200)
  @ResponseMessage(RESPONSE_MESSAGES.REFRESH_SUCCESS)
  public async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Read refresh token from httpOnly cookie (not from request body)
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!refreshToken) {
      // Clear any stale cookie and throw
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      throw new UnauthorizedException(RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN);
    }

    const deviceName = req.headers['user-agent'];
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);

    try {
      const tokens = await this.authService.refreshTokens(refreshToken, deviceName, ipAddress);

      // Set new refresh token cookie (rotation)
      res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, this.authService.getRefreshCookieOptions());

      // Return only accessToken in the body
      return { accessToken: tokens.accessToken };
    } catch (error) {
      // On any refresh failure, clear the stale cookie
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      throw error;
    }
  }

  @Post(API_PATHS.AUTH.LOGOUT)
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ResponseMessage(RESPONSE_MESSAGES.LOGOUT_SUCCESS)
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
      return null;
    }
    const accessToken = authHeader.split(' ')[1];
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    await this.authService.logout(accessToken, refreshToken);

    // Clear the refresh token cookie
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth' });
    return null;
  }

  @Get(API_PATHS.AUTH.ME)
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Session retrieved successfully')
  public async getMe(@CurrentUser() user: JwtPayload) {
    return this.authService.getMe(user.sub);
  }

  @Get(API_PATHS.AUTH.CSRF_TOKEN)
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('CSRF token generated')
  public async getCsrfToken(@CurrentUser() user: JwtPayload) {
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
  @UseGuards(JwtAuthGuard)
  @ResponseMessage('Active sessions retrieved successfully')
  public async getSessions(@CurrentUser() user: JwtPayload) {
    return this.authService.getActiveSessions(user.sub);
  }

  @Delete(`${API_PATHS.AUTH.SESSIONS}/:id`)
  @UseGuards(JwtAuthGuard)
  @ResponseMessage(RESPONSE_MESSAGES.SESSION_REVOKED)
  public async revokeSession(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.authService.revokeSession(user.sub, id);
    return null;
  }
}
