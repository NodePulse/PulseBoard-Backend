import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import {
  NotificationStatus,
  NotificationType,
  NotificationChannel,
} from './entities/notification-type.enum';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationGateway: NotificationsGateway,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
  ) {}

  public async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  public async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  public async getPreferences(
    userId: string,
  ): Promise<NotificationPreference[]> {
    return this.preferenceRepository.find({
      where: { userId },
    });
  }

  public async updatePreference(
    userId: string,
    dto: UpdatePreferenceDto,
  ): Promise<NotificationPreference> {
    let preference = await this.preferenceRepository.findOne({
      where: { userId, type: dto.type, channel: dto.channel },
    });

    if (preference) {
      preference.enabled = dto.enabled;
    } else {
      preference = this.preferenceRepository.create({
        userId,
        type: dto.type,
        channel: dto.channel,
        enabled: dto.enabled,
      });
    }

    return this.preferenceRepository.save(preference);
  }

  public async createNotification(data: {
    recipientId: string;
    type: NotificationType;
    channel: NotificationChannel;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  }): Promise<Notification | null> {
    // 1. Check user notification preference
    const preference = await this.preferenceRepository.findOne({
      where: {
        userId: data.recipientId,
        type: data.type,
        channel: data.channel,
      },
    });

    // If explicit preference exists and is disabled, skip notification
    if (preference && !preference.enabled) {
      return null;
    }

    // 2. Persist notification in database
    const notification = this.notificationRepository.create(data);
    const savedNotification =
      await this.notificationRepository.save(notification);

    // 3. Push real-time notification to user's WebSocket room
    try {
      await this.notificationGateway.sendNotificationToUser(
        savedNotification.recipientId,
        savedNotification,
      );
    } catch (_error) {
      // Log socket emission error without interrupting flow
    }

    return savedNotification;
  }
}
