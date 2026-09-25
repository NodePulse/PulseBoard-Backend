import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SessionGuard } from 'src/core/guards/session.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import { SessionPayload } from '../auth/auth.controller';
import { ChangePasswordDTO } from './dto/changePassword.dto';
import { UpdateResult } from 'typeorm';
import { API_ROUTES } from 'src/core/constants/routes';
import { SetupMfaDTO } from './dto/setupMfa.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ApiEndpoint } from 'src/core/decorators/api-endpoint.decorator';
import { ResponseMessage } from 'src/core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from 'src/core/constants/messages';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

@ApiTags('Users')
@Controller(API_ROUTES.USERS.ROOT)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // CONTROLLER
  @ApiOperation({
    summary: 'Change password',
    description: 'Change the password of the current user',
  })
  @ApiBody({ type: ChangePasswordDTO })
  @ApiEndpoint({
    201: {
      type: { affected: Number },
      message: RESPONSE_MESSAGES.USERS.CHANGE_PASSWORD_SUCCESS,
    },
    400: RESPONSE_MESSAGES.AUTH.VALIDATION_ERROR,
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Post(API_ROUTES.USERS.CHANGE_PASSWORD)
  @ResponseMessage(RESPONSE_MESSAGES.USERS.CHANGE_PASSWORD_SUCCESS)
  @UseGuards(SessionGuard)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDTO,
    @CurrentUser() user: SessionPayload,
  ): Promise<UpdateResult> {
    return this.usersService.changePassword(changePasswordDto, user.sub);
  }

  @Post('update-profile-pic')
  @UseInterceptors(FileInterceptor('image'))
  @UseGuards(SessionGuard)
  async updateProfilePicture(
    @CurrentUser() user: SessionPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('file ============>', file);
    return this.usersService.updateProfilePicture(user.sub);
  }

  // CONTROLLER
  @ApiOperation({
    summary: 'Setup MFA',
    description: 'Setup Multi-Factor Authentication for the user',
  })
  @ApiBody({ type: SetupMfaDTO })
  @ApiEndpoint({
    201: {
      type: { totpQrCode: String, mfaSecret: String },
      message: RESPONSE_MESSAGES.USERS.MFA_SETUP_SUCCESS,
    },
    400: RESPONSE_MESSAGES.AUTH.VALIDATION_ERROR,
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @Post(API_ROUTES.USERS.ADD_MFA)
  @ResponseMessage(RESPONSE_MESSAGES.USERS.MFA_SETUP_SUCCESS)
  @UseGuards(SessionGuard)
  async setupMfa(
    @CurrentUser() user: SessionPayload,
    @Body() setupMfaDto: SetupMfaDTO,
  ) {
    return this.usersService.setupMfa(user.sub, setupMfaDto);
  }
}
