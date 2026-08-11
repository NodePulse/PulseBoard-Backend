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
import { Payment } from '../../payments/entities/payment.entity';

export enum TransactionType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Payment, (payment) => payment.transactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @Column({ name: 'payment_id' })
  paymentId: string;

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
    enum: TransactionType,
  })
  type: TransactionType;

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

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
