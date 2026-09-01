import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { VerificationMailJob } from './mail.service';
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

  @EventPattern('send-verification')
  async handleSendVerification(@Payload() data: VerificationMailJob) {
    const html = getVerificationTemplate(data.magicLink, data.otp);
    await this.sendEmail(data.to, 'Verify your PulseBoard Account', html);
  }

  @EventPattern('send-welcome')
  async handleSendWelcome(@Payload() data: { to: string; name: string }) {
    const html = getWelcomeTemplate(data.name);
    await this.sendEmail(data.to, 'Welcome to PulseBoard', html);
  }

  @EventPattern('send-password-reset')
  async handleSendPasswordReset(
    @Payload() data: { to: string; resetLink: string },
  ) {
    const html = getPasswordResetTemplate(data.resetLink);
    await this.sendEmail(data.to, 'Reset your PulseBoard Password', html);
  }

  @EventPattern('send-team-invite')
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
