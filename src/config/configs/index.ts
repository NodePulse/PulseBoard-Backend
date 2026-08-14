import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import mailConfig from './mail.config';
import razorpayConfig from './razorpay.config';

export default [
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  mailConfig,
  razorpayConfig,
];

export {
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  mailConfig,
  razorpayConfig,
};
