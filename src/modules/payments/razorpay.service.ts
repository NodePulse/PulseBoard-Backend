import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';

@Injectable()
export class RazorpayService {
  private readonly razorpay: Razorpay;

  constructor(private readonly configService: ConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('razorpay.keyId'),
      key_secret: this.configService.get<string>('razorpay.secret'),
    });
  }

  async createRazorpayOrder(data: {
    amount: number;
    currency: string;
    receipt: string;
    notes: Record<string, string>;
  }) {
    return this.razorpay.orders.create({
      amount: data.amount * 100,
      currency: data.currency,
      receipt: data.receipt,
      notes: data.notes,
    });
  }

  async getRazorpayOrder(orderId: string) {
    return this.razorpay.orders.fetch(orderId);
  }
}
