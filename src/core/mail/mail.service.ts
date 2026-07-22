import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface VerificationMailJob {
  to: string;
  magicLink?: string;
  otp?: string;
}

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('mail-queue')
    private readonly mailQueue: Queue,
  ) {}

  async sendVerificationEmail(data: VerificationMailJob) {
    await this.mailQueue.add('send-verification', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    });
  }
}
