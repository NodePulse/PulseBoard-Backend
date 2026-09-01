import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('sessions')
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'status', length: 10, default: 'ACTIVE' })
  status: string; // 'ACTIVE' | 'REVOKED' | 'EXPIRED'

  @Column({ name: 'device_name', length: 255, nullable: true })
  deviceName: string | null;

  @Column({ name: 'browser', length: 100, nullable: true })
  browser: string | null;

  @Column({ name: 'operating_system', length: 100, nullable: true })
  operatingSystem: string | null;

  @Column({ name: 'ip_address', type: 'varchar', nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'revoked_at', type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @Column({
    name: 'last_used_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  lastUsedAt: Date;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;
}
