import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction, TransactionType } from './entities/transaction.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  public async recordPaymentTransaction(data: {
    paymentId: string;
    userId: string;
    amount: number;
    currency: string;
  }): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      paymentId: data.paymentId,
      userId: data.userId,
      amount: data.amount,
      currency: data.currency,
      type: TransactionType.CREDIT,
      description: 'Subscription payment',
    });

    return this.transactionRepository.save(transaction);
  }
}
