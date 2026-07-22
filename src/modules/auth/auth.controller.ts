import { Controller, Post, Body, Get, Query, UseGuards, Req, Delete, Param, HttpCode } from '@nestjs/common';
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
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import type { Request } from 'express';

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
  public async login(@Body() dto: LoginUserDTO, @Req() req: Request) {
    const deviceName = req.headers['user-agent'];
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    return this.authService.loginUser(dto, deviceName, ipAddress);
  }

  @Post(API_PATHS.AUTH.REFRESH)
  @ResponseMessage(RESPONSE_MESSAGES.REFRESH_SUCCESS)
  public async refresh(@Body() dto: RefreshTokenDTO, @Req() req: Request) {
    const deviceName = req.headers['user-agent'];
    const ipAddress = req.ip || (req.headers['x-forwarded-for'] as string);
    return this.authService.refreshTokens(dto, deviceName, ipAddress);
  }

  @Post(API_PATHS.AUTH.LOGOUT)
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ResponseMessage(RESPONSE_MESSAGES.LOGOUT_SUCCESS)
  public async logout(@Req() req: Request, @Body() dto?: { refreshToken?: string }) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return null;
    }
    const accessToken = authHeader.split(' ')[1];
    await this.authService.logout(accessToken, dto?.refreshToken);
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
