import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('sessions')
export class Session {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty()
  @Column({ name: 'status', length: 10, default: 'ACTIVE' })
  status: string; // 'ACTIVE' | 'REVOKED' | 'EXPIRED'

  @ApiProperty()
  @Column({ name: 'device_name', length: 255, nullable: true })
  deviceName: string | null;

  @ApiProperty()
  @Column({ name: 'browser', length: 100, nullable: true })
  browser: string | null;

  @ApiProperty()
  @Column({ name: 'operating_system', length: 100, nullable: true })
  operatingSystem: string | null;

  @ApiProperty()
  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string | null;

  @ApiProperty()
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @ApiProperty()
  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @ApiProperty()
  @Column({
    name: 'last_used_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastUsedAt: Date;

  @ApiProperty()
  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
