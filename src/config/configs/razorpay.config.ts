import { registerAs } from '@nestjs/config';
import { RazorpayConfig } from '../config.interface';

export default registerAs<RazorpayConfig>('razorpay', () => ({
  keyId: process.env.RAZORPAY_KEY_ID || '',
  secret: process.env.RAZORPAY_SECRET || '',
  // webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
}));
