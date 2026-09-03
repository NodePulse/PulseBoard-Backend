import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_EVENTS } from '../constants/rabbitmq';

export interface VerificationMailJob {
  to: string;
  magicLink?: string;
  otp?: string;
  jobId: string;
}

@Injectable()
export class MailService {
  constructor(@Inject('MAIL_SERVICE') private readonly client: ClientProxy) {}

  async sendVerificationEmail(data: VerificationMailJob) {
    this.client.emit(RABBITMQ_EVENTS.MAIL.SEND_VERIFICATION, data);
  }

  async sendWelcomeEmail(data: { to: string; name: string }) {
    this.client.emit(RABBITMQ_EVENTS.MAIL.SEND_WELCOME, data);
  }

  async sendPasswordResetEmail(data: {
    to: string;
    resetLink?: string;
    otp?: string;
  }) {
    this.client.emit(RABBITMQ_EVENTS.MAIL.SEND_PASSWORD_RESET, data);
  }

  async sendTeamInviteEmail(data: {
    to: string;
    inviterName: string;
    teamName: string;
    inviteLink: string;
  }) {
    this.client.emit(RABBITMQ_EVENTS.MAIL.SEND_TEAM_INVITE, data);
  }

  async cleanCompletedJobs() {
    // No-op for RabbitMQ ClientProxy since we aren't using BullMQ locally anymore
  }
}
