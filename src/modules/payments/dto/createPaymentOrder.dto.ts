import { IsEnum, IsNotEmpty } from 'class-validator';

import { PaymentMethod } from '../entities/payment.entity';
import { SubscriptionPlan } from 'src/modules/subscriptions/entities/subscription.entity';

export class CreatePaymentOrderDto {
  @IsEnum(SubscriptionPlan)
  @IsNotEmpty()
  plan: SubscriptionPlan;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;
}
