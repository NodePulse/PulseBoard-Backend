import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

export enum SubscriptionPlan {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  PRO = 'PRO',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  PAST_DUE = 'PAST_DUE',
}

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  @Index()
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant | null;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId: string | null;

  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
  })
  plan: SubscriptionPlan;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamptz', name: 'current_period_start' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamptz', name: 'current_period_end' })
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
