import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VALIDATION_MESSAGES } from 'src/core/constants/messages';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity';

export class CompletePaymentOrderDto {
  @ApiProperty({
    description: 'Cashfree Order ID',
    example: 'order_123',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.TYPE_INVALID('Order ID') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Order ID') })
  orderId: string;

  @ApiProperty({
    description: 'Cashfree Payment ID',
    example: 'pay_123',
    required: true,
  })
  @IsString({ message: VALIDATION_MESSAGES.TYPE_INVALID('Payment ID') })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Payment ID') })
  paymentId: string;

  @ApiPropertyOptional({
    description: 'Cashfree Signature (optional if verification happens server-side via API)',
    example: 'signature_abc',
  })
  @IsString({ message: VALIDATION_MESSAGES.TYPE_INVALID('Signature') })
  @IsOptional()
  cashfreeSignature?: string;

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
}
