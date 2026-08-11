import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
} from './entities/subscription.entity';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
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

    return this.subscriptionRepository.save(subscription);
  }

  public async getActiveSubscription(userId: string): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: { userId, status: SubscriptionStatus.ACTIVE },
    });
  }
}
