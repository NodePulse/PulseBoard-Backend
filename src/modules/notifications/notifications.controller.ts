import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
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
import { Request } from 'express';
import { SessionGuard } from 'src/core/guards/session.guard';

interface RequestWithUser extends Request {
  user: { sub: string; sid: string };
}

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all notifications for the current user' })
  @ApiResponse({
    status: 200,
    description: 'Return list of notifications',
    type: [Notification],
  })
  async getNotifications(@Req() req: RequestWithUser): Promise<Notification[]> {
    return this.notificationsService.getUserNotifications(req.user.sub);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: Notification,
  })
  async markAsRead(
    @Req() req: RequestWithUser,
    @Param('id') notificationId: string,
  ): Promise<Notification> {
    return this.notificationsService.markAsRead(req.user.sub, notificationId);
  }

  @Get('preferences')
  @ApiOperation({
    summary: 'Get all notification preferences for the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Return list of preferences',
    type: [NotificationPreference],
  })
  async getPreferences(
    @Req() req: RequestWithUser,
  ): Promise<NotificationPreference[]> {
    return this.notificationsService.getPreferences(req.user.sub);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update a specific notification preference' })
  @ApiResponse({
    status: 200,
    description: 'Preference updated successfully',
    type: NotificationPreference,
  })
  async updatePreference(
    @Req() req: RequestWithUser,
    @Body() dto: UpdatePreferenceDto,
  ): Promise<NotificationPreference> {
    return this.notificationsService.updatePreference(req.user.sub, dto);
  }
}
