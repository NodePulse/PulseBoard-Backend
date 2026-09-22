import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty } from 'class-validator';
import {
  NotificationType,
  NotificationChannel,
} from '../entities/notification-type.enum';
import { VALIDATION_MESSAGES } from 'src/core/constants/messages';

export class UpdatePreferenceDto {
  @ApiProperty({
    description: 'Notification Type',
    enum: NotificationType,
    example: NotificationType.WORKSPACE_INVITE,
    required: true,
  })
  @IsEnum(NotificationType, {
    message: VALIDATION_MESSAGES.TYPE_INVALID('Notification Type'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Notification Type') })
  type: NotificationType;

  @ApiProperty({
    description: 'Notification Channel',
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
    required: true,
  })
  @IsEnum(NotificationChannel, {
    message: VALIDATION_MESSAGES.TYPE_INVALID('Notification Channel'),
  })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Notification Channel') })
  channel: NotificationChannel;

  @ApiProperty({
    description: 'Enabled',
    example: true,
    type: 'boolean',
    required: true,
  })
  @IsBoolean({ message: 'Enabled must be a boolean value' })
  @IsNotEmpty({ message: VALIDATION_MESSAGES.REQUIRED('Enabled') })
  enabled: boolean;
}
