import { SubscriptionPlan } from '../../modules/subscriptions/entities/subscription.entity';

export const SUBSCRIPTION_PLANS = {
  [SubscriptionPlan.BASIC]: {
    monthlyAmount: 499,
    yearlyAmount: 4990, // 2 months free
    currency: 'INR',
    isActive: true,
  },
  [SubscriptionPlan.PREMIUM]: {
    monthlyAmount: 999,
    yearlyAmount: 9990,
    currency: 'INR',
    isActive: true,
  },
  [SubscriptionPlan.PRO]: {
    monthlyAmount: 1499,
    yearlyAmount: 14990,
    currency: 'INR',
    isActive: true,
  },
};
