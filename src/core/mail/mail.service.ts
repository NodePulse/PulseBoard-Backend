import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_EVENTS } from '../constants/rabbitmq';
import { firstValueFrom } from 'rxjs';
import { MailController } from './mail.controller';

export interface VerificationMailJob {
  to: string;
  magicLink?: string;
  otp?: string;
  jobId: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);

  constructor(
    @Inject('MAIL_SERVICE') private readonly client: ClientProxy,
    private readonly mailController: MailController,
  ) {}

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      this.logger.warn(
        'Could not connect to RabbitMQ broker on init, fallback to direct mail sending when needed.',
      );
    }
  }

  async sendVerificationEmail(data: VerificationMailJob) {
    try {
      await firstValueFrom(
        this.client.emit(RABBITMQ_EVENTS.MAIL.SEND_VERIFICATION, data),
      );
    } catch (error) {
      this.logger.warn(
        `RabbitMQ emit failed: ${error}. Sending verification email directly.`,
      );
      await this.mailController.handleSendVerification(data);
    }
  }

  async sendWelcomeEmail(data: { to: string; name: string }) {
    try {
      await firstValueFrom(
        this.client.emit(RABBITMQ_EVENTS.MAIL.SEND_WELCOME, data),
      );
    } catch (error) {
      this.logger.warn(
        `RabbitMQ emit failed: ${error}. Sending welcome email directly.`,
      );
      await this.mailController.handleSendWelcome(data);
    }
  }

  async sendPasswordResetEmail(data: {
    to: string;
    resetLink?: string;
    otp?: string;
  }) {
    try {
      await firstValueFrom(
        this.client.emit(RABBITMQ_EVENTS.MAIL.SEND_PASSWORD_RESET, data),
      );
    } catch (error) {
      this.logger.warn(
        `RabbitMQ emit failed: ${error}. Sending password reset email directly.`,
      );
      await this.mailController.handleSendPasswordReset(data as any);
    }
  }

  async sendTeamInviteEmail(data: {
    to: string;
    inviterName: string;
    teamName: string;
    inviteLink: string;
  }) {
    try {
      await firstValueFrom(
        this.client.emit(RABBITMQ_EVENTS.MAIL.SEND_TEAM_INVITE, data),
      );
    } catch (error) {
      this.logger.warn(
        `RabbitMQ emit failed: ${error}. Sending team invite email directly.`,
      );
      await this.mailController.handleSendTeamInvite(data);
    }
  }

  async cleanCompletedJobs() {}
}
