import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { VerificationMailJob } from './mail.service';
import { RABBITMQ_EVENTS } from '../constants/rabbitmq';
import {
  getVerificationTemplate,
  getWelcomeTemplate,
  getPasswordResetTemplate,
  getTeamInviteTemplate,
} from './mail.templates';

@Controller()
export class MailController {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.pass'),
      },
    });
    this.fromEmail =
      this.configService.get<string>('mail.fromEmail') ||
      'noreply@pulseboard.com';
  }

  private async sendEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: `"PulseBoard" <${this.fromEmail}>`,
        to,
        subject,
        html,
      });
      console.log(`Email sent successfully to ${to}`);
    } catch (error) {
      console.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  @EventPattern(RABBITMQ_EVENTS.MAIL.SEND_VERIFICATION)
  async handleSendVerification(@Payload() data: VerificationMailJob) {
    const html = getVerificationTemplate(data.magicLink, data.otp);
    await this.sendEmail(data.to, 'Verify your PulseBoard Account', html);
  }

  @EventPattern(RABBITMQ_EVENTS.MAIL.SEND_WELCOME)
  async handleSendWelcome(@Payload() data: { to: string; name: string }) {
    const html = getWelcomeTemplate(data.name);
    await this.sendEmail(data.to, 'Welcome to PulseBoard', html);
  }

  @EventPattern(RABBITMQ_EVENTS.MAIL.SEND_PASSWORD_RESET)
  async handleSendPasswordReset(
    @Payload() data: { to: string; otp: string },
  ) {
    const html = getPasswordResetTemplate(data.otp);
    await this.sendEmail(data.to, 'Reset your PulseBoard Password', html);
  }

  @EventPattern(RABBITMQ_EVENTS.MAIL.SEND_TEAM_INVITE)
  async handleSendTeamInvite(
    @Payload() data: {
      to: string;
      inviterName: string;
      teamName: string;
      inviteLink: string;
    },
  ) {
    const html = getTeamInviteTemplate(
      data.inviterName,
      data.teamName,
      data.inviteLink,
    );
    await this.sendEmail(data.to, `Join ${data.teamName} on PulseBoard`, html);
  }
}
