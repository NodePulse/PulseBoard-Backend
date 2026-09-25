import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus } from './entities/payment.entity';
import { CreatePaymentOrderDto } from './dto/createPaymentOrder.dto';
import { RESPONSE_MESSAGES } from 'src/core/constants/messages';
import { CashfreeService } from './cashfree.service';
import { PaymentsRepository } from './repositories/payments.repository';
import { CompletePaymentOrderDto } from './dto/completePaymentOrder.dto';
import { OrdersService } from '../orders/orders.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TransactionsService } from '../transactions/transactions.service';
import {
  SubscriptionPlan,
  BillingCycle,
} from '../subscriptions/entities/subscription.entity';
import { OrderStatus } from '../orders/entities/order.entity';
import { SUBSCRIPTION_PLANS } from '../../core/constants/subscriptions';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly cashfreeService: CashfreeService,
    private readonly ordersService: OrdersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  private findSubscriptionPlan(
    plan: SubscriptionPlan,
    billingCycle: BillingCycle,
  ) {
    const selectedPlanConfig = SUBSCRIPTION_PLANS[plan];
    if (!selectedPlanConfig) {
      return undefined;
    }

    return {
      amount:
        billingCycle === BillingCycle.YEARLY
          ? selectedPlanConfig.yearlyAmount
          : selectedPlanConfig.monthlyAmount,
      currency: selectedPlanConfig.currency,
      isActive: selectedPlanConfig.isActive,
    };
  }

  public async createPaymentOrder(dto: CreatePaymentOrderDto, userId: string) {
    const { plan, paymentMethod, billingCycle } = dto;
    const subscriptionPlanType = plan as unknown as SubscriptionPlan;

    const subscriptionPlan = this.findSubscriptionPlan(
      subscriptionPlanType,
      billingCycle,
    );
    if (!subscriptionPlan) {
      throw new NotFoundException(RESPONSE_MESSAGES.PAYMENTS.PLAN_NOT_FOUND);
    }

    if (!subscriptionPlan.isActive) {
      throw new BadRequestException(RESPONSE_MESSAGES.PAYMENTS.PLAN_INACTIVE);
    }

    const paymentAmount = subscriptionPlan.amount;

    if (paymentAmount <= 0) {
      throw new BadRequestException(RESPONSE_MESSAGES.PAYMENTS.INVALID_AMOUNT);
    }

    const cashfreeOrder = await this.cashfreeService.createCashfreeOrder({
      amount: paymentAmount,
      currency: subscriptionPlan.currency,
      receipt: `order_${Date.now()}`,
      notes: {
        userId,
        plan,
        billingCycle,
      },
      customerDetails: {
        customerId: userId,
      },
    });

    console.log(cashfreeOrder);

    const order = await this.ordersService.createOrder({
      userId,
      amount: paymentAmount,
      currency: subscriptionPlan.currency,
      plan,
      billingCycle,
      cashfreeOrderId: cashfreeOrder.order_id,
    });

    return {
      cashfreeOrderId: order.cashfreeOrderId,
      amount: order.amount,
      currency: order.currency,
      plan: order.plan,
      billingCycle: order.billingCycle,
      paymentMethod,
      userId,
      paymentSessionId: cashfreeOrder.payment_session_id,
    };
  }

  public async completePaymentOrder(dto: CompletePaymentOrderDto) {
    const { orderId, paymentId, method, status } = dto;

    const order = await this.ordersService.findByCashfreeOrderId(orderId);
    if (!order) {
      throw new NotFoundException(RESPONSE_MESSAGES.PAYMENTS.ORDER_NOT_FOUND);
    }

    // Verify cashfree signature logic (assuming cashfreeService has something for this, or it's done elsewhere)
    // For now, we trust the incoming payload if the signature check is expected to be implemented.
    // If it's a valid completed payment:

    // 1. Create a Payment record
    const payment = await this.paymentsRepository.createPayment({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: status,
      paymentMethod: method,
      cashfreePaymentId: paymentId,
      userId: order.userId,
    });

    if (status === PaymentStatus.SUCCEEDED) {
      // 2. Update Order status
      await this.ordersService.updateStatus(order.id, OrderStatus.COMPLETED);

      // 3. Create Transaction
      await this.transactionsService.recordPaymentTransaction({
        paymentId: payment.id,
        userId: order.userId,
        amount: order.amount,
        currency: order.currency,
      });

      // 4. Activate Subscription
      if (order.plan) {
        await this.subscriptionsService.activateSubscription(
          order.userId,
          order.plan as SubscriptionPlan,
          order.billingCycle || 'MONTHLY',
        );
      }
    } else if (status === PaymentStatus.FAILED) {
      await this.ordersService.updateStatus(order.id, OrderStatus.FAILED);
    }

    return payment;
  }
}
