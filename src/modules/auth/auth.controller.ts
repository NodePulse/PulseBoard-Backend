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
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { JwtPayload } from './auth.service';
import { RegisterUserDTO } from './dto/registerUser.dto';
import { LoginUserDTO } from './dto/loginUser.dto';
import { VerifyOtpDTO } from './dto/verifyOtp.dto';
import { ResendVerificationDTO } from './dto/resendVerification.dto';
import { RefreshTokenDTO } from './dto/refreshToken.dto';
import { API_PATHS } from '../../core/constants/paths';
import { ResponseMessage } from '../../core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from '../../core/constants/messages';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { SessionGuard } from '../../core/guards/session.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import type { Request, Response } from 'express';

@Controller(API_PATHS.AUTH.ROOT)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    const { accessToken, refreshToken, user } =
      await this.authService.loginUser(dto, deviceName, ipAddress);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return { accessToken, user };
  }

  @Post(API_PATHS.AUTH.REFRESH)
  @ResponseMessage(RESPONSE_MESSAGES.REFRESH_SUCCESS)
  public async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const deviceName = req.headers['user-agent'];
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    const { accessToken, refreshToken: newRefreshToken } =
      await this.authService.refreshTokens(
        { refreshToken },
        deviceName,
        ipAddress,
      );

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return { accessToken };
  }

  @Post(API_PATHS.AUTH.LOGOUT)
  @UseGuards(JwtAuthGuard, SessionGuard)
  @HttpCode(200)
  @ResponseMessage(RESPONSE_MESSAGES.LOGOUT_SUCCESS)
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return null;
    }
    const accessToken = authHeader.split(' ')[1];
    const refreshToken = req.cookies['refresh_token'];
    await this.authService.logout(accessToken, refreshToken);

    res.clearCookie('refresh_token', {
      path: '/',
    });
    return null;
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
  @UseGuards(JwtAuthGuard, SessionGuard)
  @ResponseMessage('Active sessions retrieved successfully')
  public async getSessions(@CurrentUser() user: JwtPayload) {
    return this.authService.getActiveSessions(user.sub);
  }

  @Delete(`${API_PATHS.AUTH.SESSIONS}/:id`)
  @UseGuards(JwtAuthGuard, SessionGuard)
  @ResponseMessage(RESPONSE_MESSAGES.SESSION_REVOKED)
  public async revokeSession(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    await this.authService.revokeSession(user.sub, id);
    return null;
  }
}
