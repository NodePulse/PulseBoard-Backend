import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from 'src/core/constants/messages';
import { PaymentMethod } from '../entities/payment.entity';
import {
  SubscriptionPlan,
  BillingCycle,
} from 'src/modules/subscriptions/entities/subscription.entity';

export class CreatePaymentOrderDto {
  @ApiProperty({
    description: 'Subscription Plan',
    enum: SubscriptionPlan,
    example: SubscriptionPlan.PRO,
    required: true,
  })
  @IsEnum(SubscriptionPlan, {
    message: VALIDATION_MESSAGES.TYPE_INVALID('Subscription Plan'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Subscription Plan') })
  plan: SubscriptionPlan;

  @ApiProperty({
    description: 'Billing Cycle',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
    required: true,
  })
  @IsEnum(BillingCycle, {
    message: VALIDATION_MESSAGES.TYPE_INVALID('Billing Cycle'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Billing Cycle') })
  billingCycle: BillingCycle;

  @ApiProperty({
    description: 'Payment Method',
    enum: PaymentMethod,
    example: PaymentMethod.CASHFREE,
    required: true,
  })
  @IsEnum(PaymentMethod, {
    message: VALIDATION_MESSAGES.TYPE_INVALID('Payment Method'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Payment Method') })
  paymentMethod: PaymentMethod;
}
