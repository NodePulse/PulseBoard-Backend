import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationChannel } from '../notifications/entities/notification-type.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly notificationsService: NotificationsService,
  ) {}

  public async createOrder(data: {
    userId: string;
    amount: number;
    currency: string;
    plan?: string;
    razorpayOrderId?: string;
  }): Promise<Order> {
    const order = this.orderRepository.create({
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      plan: data.plan,
      razorpayOrderId: data.razorpayOrderId,
      status: OrderStatus.PENDING,
    });

    return this.orderRepository.save(order);
  }

  public async findByRazorpayOrderId(
    razorpayOrderId: string,
  ): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: { razorpayOrderId },
    });
  }

  public async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new Error('Order not found');
    }
    order.status = status;
    const savedOrder = await this.orderRepository.save(order);

    if (status === OrderStatus.COMPLETED) {
      await this.notificationsService.createNotification({
        recipientId: savedOrder.userId,
        type: NotificationType.TRANSACTION_ALERT,
        channel: NotificationChannel.IN_APP,
        title: 'Order Completed',
        body: `Your order was successfully completed for ${savedOrder.currency} ${savedOrder.amount}.`,
      });
    } else if (status === OrderStatus.FAILED) {
      await this.notificationsService.createNotification({
        recipientId: savedOrder.userId,
        type: NotificationType.TRANSACTION_ALERT,
        channel: NotificationChannel.IN_APP,
        title: 'Order Failed',
        body: `Your order failed to process. Please try again.`,
      });
    }

    return savedOrder;
  }
}
