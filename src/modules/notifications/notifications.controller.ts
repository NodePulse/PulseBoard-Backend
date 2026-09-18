import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { SessionGuard } from 'src/core/guards/session.guard';
import { CurrentUser } from 'src/core/decorators/current-user.decorator';
import type { SessionPayload } from '../auth/auth.controller';
import { API_ROUTES } from 'src/core/constants/routes';
import { ResponseMessage } from 'src/core/decorators/response-message.decorator';
import { RESPONSE_MESSAGES } from 'src/core/constants/messages';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller(API_ROUTES.NOTIFICATIONS.ROOT)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return list of notifications',
    type: [Notification],
  })
  @ResponseMessage(RESPONSE_MESSAGES.NOTIFICATIONS.LIST_SUCCESS)
  public async getNotifications(
    @CurrentUser() user: SessionPayload,
  ): Promise<Notification[]> {
    return this.notificationsService.getUserNotifications(user.sub);
  }

  @Patch(API_ROUTES.NOTIFICATIONS.MARK_READ)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: Notification,
  })
  @ResponseMessage(RESPONSE_MESSAGES.NOTIFICATIONS.MARK_READ_SUCCESS)
  public async markAsRead(
    @CurrentUser() user: SessionPayload,
    @Param('id') notificationId: string,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(user.sub, notificationId);
  }

  @Get(API_ROUTES.NOTIFICATIONS.PREFERENCES)
  @ApiOperation({
    summary: 'Get all notification preferences for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Return list of preferences',
    type: [NotificationPreference],
  })
  @ResponseMessage(RESPONSE_MESSAGES.NOTIFICATIONS.PREFERENCES_SUCCESS)
  public async getPreferences(
    @CurrentUser() user: SessionPayload,
  ): Promise<NotificationPreference[]> {
    return this.notificationsService.getPreferences(user.sub);
  }

  @Patch(API_ROUTES.NOTIFICATIONS.PREFERENCES)
  @ApiOperation({ summary: 'Update a specific notification preference' })
  @ApiResponse({
    status: 200,
    description: 'Preference updated successfully',
    type: NotificationPreference,
  })
  @ResponseMessage(RESPONSE_MESSAGES.NOTIFICATIONS.UPDATE_PREFERENCE_SUCCESS)
  public async updatePreference(
    @CurrentUser() user: SessionPayload,
    @Body() dto: UpdatePreferenceDto,
  ): Promise<NotificationPreference> {
    return this.notificationsService.updatePreference(user.sub, dto);
  }
}
