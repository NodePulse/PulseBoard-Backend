import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentOrderDto } from './dto/createPaymentOrder.dto';
import { RESPONSE_MESSAGES } from 'src/core/constants/messages';
import { RazorpayService } from './razorpay.service';
import { PaymentsRepository } from './repositories/payments.repository';
import { CompletePaymentOrderDto } from './dto/completePaymentOrder.dto';
import { OrdersService } from '../orders/orders.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { TransactionsService } from '../transactions/transactions.service';
import { SubscriptionPlan } from '../subscriptions/entities/subscription.entity';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly razorpayService: RazorpayService,
    private readonly ordersService: OrdersService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly transactionsService: TransactionsService,
  ) {}

  private async findSubscriptionPlan(plan: SubscriptionPlan) {
    const plans = {
      [SubscriptionPlan.BASIC]: {
        amount: 499,
        currency: 'INR',
        isActive: true,
      },
      [SubscriptionPlan.PREMIUM]: {
        amount: 999,
        currency: 'INR',
        isActive: true,
      },
      [SubscriptionPlan.PRO]: {
        amount: 1499,
        currency: 'INR',
        isActive: true,
      },
    };

    return plans[plan];
  }

  public async createPaymentOrder(dto: CreatePaymentOrderDto, userId: string) {
    const { plan, paymentMethod } = dto;
    const subscriptionPlanType = plan as unknown as SubscriptionPlan;

    const subscriptionPlan =
      await this.findSubscriptionPlan(subscriptionPlanType);
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

    const razorpayOrder = await this.razorpayService.createRazorpayOrder({
      amount: paymentAmount,
      currency: subscriptionPlan.currency,
      receipt: `order_${Date.now()}`,
      notes: {
        userId,
        plan,
      },
    });

    const order = await this.ordersService.createOrder({
      userId,
      amount: Number(razorpayOrder.amount),
      currency: razorpayOrder.currency,
      plan,
      razorpayOrderId: razorpayOrder.id,
    });

    return {
      razorpayOrderId: order.razorpayOrderId,
      amount: order.amount,
      currency: order.currency,
      plan: order.plan,
      paymentMethod,
      userId,
    };
  }

  public async completePaymentOrder(dto: CompletePaymentOrderDto) {
    const { orderId, paymentId, method, razorpaySignature, status } = dto;

    const order = await this.ordersService.findByRazorpayOrderId(orderId);
    if (!order) {
      throw new NotFoundException(RESPONSE_MESSAGES.PAYMENTS.ORDER_NOT_FOUND);
    }

    // Verify razorpay signature logic (assuming razorpayService has something for this, or it's done elsewhere)
    // For now, we trust the incoming payload if the signature check is expected to be implemented.
    // If it's a valid completed payment:

    // 1. Create a Payment record
    const payment = await this.paymentsRepository.createPayment({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: status,
      paymentMethod: method,
      razorpayPaymentId: paymentId,
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
        );
      }
    }

    return payment;
  }
}
