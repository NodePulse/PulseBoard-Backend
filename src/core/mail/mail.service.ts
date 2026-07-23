import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface VerificationMailJob {
  to: string;
  magicLink?: string;
  otp?: string;
  jobId: string;
}

const REMOVE_ON_COMPLETE_AGE = 60 * 5; // 5 minutes
const REMOVE_ON_COMPLETE_COUNT = 10;

@Injectable()
export class MailService {
  constructor(
    @InjectQueue('mail-queue')
    private readonly mailQueue: Queue,
  ) { }

  async sendVerificationEmail(data: VerificationMailJob) {
    await this.mailQueue.add('send-verification', data, {
      jobId: data.jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: REMOVE_ON_COMPLETE_AGE,
        count: REMOVE_ON_COMPLETE_COUNT,
      },
    });
  }

  async removeJob(jobId: string) {
    const job = await this.mailQueue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  async cleanCompletedJobs() {
    // Removes up to 1000 completed jobs with a 0ms grace period
    await this.mailQueue.clean(0, 1000, 'completed');
  }
}
