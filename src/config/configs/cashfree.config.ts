import { registerAs } from '@nestjs/config';

export default registerAs('cashfree', () => ({
  appId: process.env.CASHFREE_APP_ID || '',
  secret: process.env.CASHFREE_SECRET_KEY || '',
  environment: process.env.CASHFREE_ENVIRONMENT || 'SANDBOX',
}));
