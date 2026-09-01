import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

export interface VerificationMailJob {
  to: string;
  magicLink?: string;
  otp?: string;
  jobId: string;
}

@Injectable()
export class MailService {
  constructor(
    @Inject('MAIL_SERVICE') private readonly client: ClientProxy,
  ) {}

  async sendVerificationEmail(data: VerificationMailJob) {
    this.client.emit('send-verification', data);
  }

  async sendWelcomeEmail(data: { to: string; name: string }) {
    this.client.emit('send-welcome', data);
  }

  async sendPasswordResetEmail(data: { to: string; resetLink: string }) {
    this.client.emit('send-password-reset', data);
  }

  async sendTeamInviteEmail(data: {
    to: string;
    inviterName: string;
    teamName: string;
    inviteLink: string;
  }) {
    this.client.emit('send-team-invite', data);
  }

  async cleanCompletedJobs() {
    // No-op for RabbitMQ ClientProxy since we aren't using BullMQ locally anymore
  }
}
