import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cashfree, CFEnvironment } from 'cashfree-pg';

@Injectable()
export class CashfreeService {
  private readonly logger = new Logger(CashfreeService.name);
  private cashfree: Cashfree;

  constructor(private readonly configService: ConfigService) {
    const environment =
      this.configService.get<string>('cashfree.environment') === 'PRODUCTION'
        ? CFEnvironment.PRODUCTION
        : CFEnvironment.SANDBOX;

    this.cashfree = new Cashfree(
      environment,
      this.configService.get<string>('cashfree.appId') || '',
      this.configService.get<string>('cashfree.secret') || '',
    );
  }

  async createCashfreeOrder(data: {
    amount: number;
    currency: string;
    receipt: string;
    notes: Record<string, string>;
    customerDetails: {
      customerId: string;
      customerPhone?: string;
      customerEmail?: string;
    };
  }) {
    try {
      const request = {
        order_amount: data.amount,
        order_currency: data.currency,
        order_id: data.receipt,
        customer_details: {
          customer_id: data.customerDetails.customerId,
          customer_phone: data.customerDetails.customerPhone || '9999999999',
          customer_email:
            data.customerDetails.customerEmail || 'test@example.com',
        },
        order_meta: {
          return_url:
            'http://localhost:3000/payments/callback?order_id={order_id}',
        },
        order_tags: data.notes,
      };

      const response = await this.cashfree.PGCreateOrder(request);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to create Cashfree order', error);
      throw error;
    }
  }

  async verifyCashfreeOrder(orderId: string) {
    try {
      const response = await this.cashfree.PGFetchOrder(orderId);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to verify Cashfree order ${orderId}`, error);
      throw error;
    }
  }
}
