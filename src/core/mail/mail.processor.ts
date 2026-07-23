import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { VerificationMailJob } from './mail.service';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    super();
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('mail.host'),
      port: this.configService.get<number>('mail.port'),
      auth: {
        user: this.configService.get<string>('mail.user'),
        pass: this.configService.get<string>('mail.pass'),
      },
    });
    this.fromEmail = this.configService.get<string>('mail.fromEmail') || 'noreply@pulseboard.com';
  }

  async process(job: Job<VerificationMailJob>) {
    switch (job.name) {
      case 'send-verification':
        await this.handleSendVerification(job.data);
        break;
      default:
        console.warn(`No handler for mail job: ${job.name}`);
    }
  }

  private async handleSendVerification(data: VerificationMailJob) {
    let html = `<h1>Verify your PulseBoard Account</h1>`;
    
    if (data.magicLink) {
      html += `<p>Click the link below to verify your account:</p>
               <a href="${data.magicLink}">Verify Account</a><br/><br/>`;
    }
    
    if (data.otp) {
      html += `<p>Or use this One-Time Password (OTP):</p>
               <h2>${data.otp}</h2>`;
    }

    try {
      await this.transporter.sendMail({
        from: `"PulseBoard" <${this.fromEmail}>`,
        to: data.to,
        subject: 'Verify your PulseBoard Account',
        html,
      });
    } catch (error) {
      console.error(`Failed to send verification email to ${data.to}:`, error);
      throw error;
    }
  }
}
