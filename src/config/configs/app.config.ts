import { registerAs } from '@nestjs/config';
import { AppConfig } from '../config.interface';

export default registerAs<AppConfig>('app', () => ({
  name: process.env.APP_NAME || 'PulseBoard',
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  prefix: process.env.API_PREFIX || 'api',
}));
