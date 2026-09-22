import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from 'src/core/constants/messages';
import { PaymentMethod } from '../entities/payment.entity';
import { SubscriptionPlan } from 'src/modules/subscriptions/entities/subscription.entity';

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
    description: 'Payment Method',
    enum: PaymentMethod,
    example: PaymentMethod.RAZORPAY,
    required: true,
  })
  @IsEnum(PaymentMethod, {
    message: VALIDATION_MESSAGES.TYPE_INVALID('Payment Method'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Payment Method') })
  paymentMethod: PaymentMethod;
}
