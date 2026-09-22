import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
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
import { ApiEndpoint } from 'src/core/decorators/api-endpoint.decorator';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller(API_ROUTES.NOTIFICATIONS.ROOT)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // CONTROLLER
  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiEndpoint({
    200: {
      type: [Notification],
      message: RESPONSE_MESSAGES.NOTIFICATIONS.LIST_SUCCESS,
    },
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @ResponseMessage(RESPONSE_MESSAGES.NOTIFICATIONS.LIST_SUCCESS)
  public async getNotifications(
    @CurrentUser() user: SessionPayload,
  ): Promise<Notification[]> {
    return this.notificationsService.getUserNotifications(user.sub);
  }

  // CONTROLLER
  @Patch(API_ROUTES.NOTIFICATIONS.MARK_READ)
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiEndpoint({
    200: {
      type: Notification,
      message: RESPONSE_MESSAGES.NOTIFICATIONS.MARK_READ_SUCCESS,
    },
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @ResponseMessage(RESPONSE_MESSAGES.NOTIFICATIONS.MARK_READ_SUCCESS)
  public async markAsRead(
    @CurrentUser() user: SessionPayload,
    @Param('id') notificationId: string,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(user.sub, notificationId);
  }

  // CONTROLLER
  @Get(API_ROUTES.NOTIFICATIONS.PREFERENCES)
  @ApiOperation({
    summary: 'Get all notification preferences for the current user',
  })
  @ApiEndpoint({
    200: {
      type: [NotificationPreference],
      message: RESPONSE_MESSAGES.NOTIFICATIONS.PREFERENCES_SUCCESS,
    },
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @ResponseMessage(RESPONSE_MESSAGES.NOTIFICATIONS.PREFERENCES_SUCCESS)
  public async getPreferences(
    @CurrentUser() user: SessionPayload,
  ): Promise<NotificationPreference[]> {
    return this.notificationsService.getPreferences(user.sub);
  }

  // CONTROLLER
  @Patch(API_ROUTES.NOTIFICATIONS.PREFERENCES)
  @ApiOperation({ summary: 'Update a specific notification preference' })
  @ApiBody({ type: UpdatePreferenceDto })
  @ApiEndpoint({
    200: {
      type: NotificationPreference,
      message: RESPONSE_MESSAGES.NOTIFICATIONS.UPDATE_PREFERENCE_SUCCESS,
    },
    400: RESPONSE_MESSAGES.AUTH.VALIDATION_ERROR,
    401: RESPONSE_MESSAGES.UNAUTHORIZED_TOKEN,
  })
  @ResponseMessage(RESPONSE_MESSAGES.NOTIFICATIONS.UPDATE_PREFERENCE_SUCCESS)
  public async updatePreference(
    @CurrentUser() user: SessionPayload,
    @Body() dto: UpdatePreferenceDto,
  ): Promise<NotificationPreference> {
    return this.notificationsService.updatePreference(user.sub, dto);
  }
}
