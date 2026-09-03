import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { User } from '../../users/entities/user.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  RAZORPAY = 'RAZORPAY',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  WALLET = 'WALLET',
}

@Entity('payments')
@Index(['userId', 'status'])
@Index(['razorpayPaymentId'])
export class Payment {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ApiProperty()
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty()
  @OneToOne(() => Order, (order) => order.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ApiProperty()
  @Column({ name: 'order_id' })
  orderId: string;

  @ApiProperty()
  @Column({
    type: 'bigint',
    transformer: {
      to: (value: number) => value,
      from: (value: string) => Number(value),
    },
  })
  amount: number;

  @ApiProperty()
  @Column({
    type: 'varchar',
    length: 3,
  })
  currency: string;

  @ApiProperty()
  @Column({
    type: 'varchar',
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @ApiProperty()
  @Column({
    type: 'varchar',
  })
  paymentMethod: PaymentMethod;

  @ApiProperty()
  @Column({
    name: 'razorpay_payment_id',
    length: 255,
    nullable: true,
  })
  razorpayPaymentId: string | null;

  @ApiProperty()
  @Column({
    name: 'razorpay_signature',
    length: 512,
    nullable: true,
    select: false,
  })
  razorpaySignature: string | null;

  @ApiProperty()
  @OneToMany(() => Transaction, (transaction) => transaction.payment)
  transactions: Transaction[];

  @ApiProperty()
  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;
}
