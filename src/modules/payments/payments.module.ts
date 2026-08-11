import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RazorpayService } from './razorpay.service';
import { PaymentsRepository } from './repositories/payments.repository';
import { SessionModule } from '../session/session.module';
import { OrdersModule } from '../orders/orders.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    SessionModule,
    OrdersModule,
    SubscriptionsModule,
    TransactionsModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, RazorpayService, PaymentsRepository],
})
export class PaymentsModule {}
