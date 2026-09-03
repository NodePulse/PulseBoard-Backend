import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from './entities/subscription.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../notifications/entities/notification-type.enum';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    private readonly notificationsService: NotificationsService,
  ) {}

  public async activateSubscription(
    userId: string,
    plan: SubscriptionPlan,
  ): Promise<Subscription> {
    // 1 month subscription
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    // Cancel any existing active subscriptions for this user
    await this.subscriptionRepository.update(
      { userId, status: SubscriptionStatus.ACTIVE },
      { status: SubscriptionStatus.CANCELLED },
    );

    const subscription = this.subscriptionRepository.create({
      userId,
      plan,
      status: SubscriptionStatus.ACTIVE,
      currentPeriodStart,
      currentPeriodEnd,
    });

    const savedSubscription = await this.subscriptionRepository.save(subscription);

    await this.notificationsService.createNotification({
      recipientId: userId,
      type: NotificationType.ACCOUNT_UPDATE,
      channel: NotificationChannel.IN_APP,
      title: 'Subscription Activated',
      body: `Your subscription to the ${plan} plan is now active.`,
    });

    return savedSubscription;
  }

  public async getActiveSubscription(
    userId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
  }
}
