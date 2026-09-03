import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { NotificationStatus, NotificationType, NotificationChannel } from './entities/notification-type.enum';
import { UpdatePreferenceDto } from './dto/update-preference.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
  ) {}

  public async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  public async markAsRead(userId: string, notificationId: string): Promise<Notification> {
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

  public async getPreferences(userId: string): Promise<NotificationPreference[]> {
    return this.preferenceRepository.find({
      where: { userId },
    });
  }

  public async updatePreference(userId: string, dto: UpdatePreferenceDto): Promise<NotificationPreference> {
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
  }): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    return this.notificationRepository.save(notification);
  }
}
