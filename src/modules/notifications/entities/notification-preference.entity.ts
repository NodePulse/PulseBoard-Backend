import { ApiProperty } from '@nestjs/swagger';
// notification-preference.entity.ts
// per-user opt-in/out per type+channel — needed to respect user settings before sending
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import {
  NotificationType,
  NotificationChannel,
} from './notification-type.enum';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('notification_preferences')
@Unique(['userId', 'type', 'channel'])
export class NotificationPreference {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ApiProperty()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty()
  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @ApiProperty()
  @Column({ type: 'boolean', default: true })
  enabled: boolean;
}
