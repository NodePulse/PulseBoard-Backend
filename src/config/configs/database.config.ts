import { registerAs } from '@nestjs/config';
import { DatabaseConfig } from '../config.interface';

export default registerAs<DatabaseConfig>('database', () => ({
  url: process.env.DATABASE_URL,
  poolSize: process.env.DB_POOL_SIZE
    ? parseInt(process.env.DB_POOL_SIZE, 10)
    : 10,
  ssl: process.env.DB_SSL === 'true',
}));
