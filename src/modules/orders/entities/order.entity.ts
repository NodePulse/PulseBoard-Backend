import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Payment } from '../../payments/entities/payment.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
export class Order {
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
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  amount: number;

  @Column({ type: 'varchar', length: 3 })
  currency: string;

  @Column({
    type: 'varchar',
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ name: 'razorpay_order_id', length: 255, nullable: true })
  @Index()
  razorpayOrderId: string | null;

  @Column({ length: 100, nullable: true })
  plan: string | null;

  // The relationship will be mapped in the Payment entity
  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt: Date;
}
