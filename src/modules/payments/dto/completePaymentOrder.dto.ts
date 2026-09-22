import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from 'src/core/constants/messages';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CompletePaymentOrderDto {
  @ApiProperty({
    description: 'Order ID',
    example: 'order_12345',
    type: 'string',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Order ID') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Order ID') })
  orderId: string;

  @ApiProperty({
    description: 'Payment ID',
    example: 'pay_12345',
    type: 'string',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.MUST_BE_STRING('Payment ID') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Payment ID') })
  paymentId: string;

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
  method: PaymentMethod;

  @ApiProperty({
    description: 'Payment Status',
    enum: PaymentStatus,
    example: PaymentStatus.SUCCEEDED,
    required: true,
  })
  @IsEnum(PaymentStatus, {
    message: VALIDATION_MESSAGES.TYPE_INVALID('Payment Status'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Payment Status') })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Razorpay Signature',
    example: 'signature_12345',
    type: 'string',
    required: true,
  })
  @IsString({
    message: VALIDATION_MESSAGES.MUST_BE_STRING('Razorpay Signature'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Razorpay Signature') })
  razorpaySignature: string;
}
