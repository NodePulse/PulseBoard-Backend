import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CompletePaymentOrderDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  method: PaymentMethod;

  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  status: PaymentStatus;

  @IsString()
  @IsNotEmpty()
  razorpaySignature: string;
}
