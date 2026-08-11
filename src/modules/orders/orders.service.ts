import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
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

  public async findByRazorpayOrderId(razorpayOrderId: string): Promise<Order | null> {
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
    return this.orderRepository.save(order);
  }
}
