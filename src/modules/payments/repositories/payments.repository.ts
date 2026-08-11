import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Payment } from '../entities/payment.entity';

@Injectable()
export class PaymentsRepository extends Repository<Payment> {
  constructor(private dataSource: DataSource) {
    super(Payment, dataSource.createEntityManager());
  }

  async createPayment(payment: Partial<Payment>): Promise<Payment> {
    return this.save(payment);
  }

  async updatePayment(
    id: string,
    updateData: Partial<Payment>,
  ): Promise<Payment> {
    await this.update(id, updateData);
    return this.findOneBy({ id });
  }

  async findPaymentById(id: string): Promise<Payment | null> {
    return this.findOneBy({ id });
  }

}
