import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import mailConfig from './mail.config';
import razorpayConfig from './razorpay.config';

import rabbitmqConfig from './rabbitmq.config';

export default [
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  mailConfig,
  razorpayConfig,
  rabbitmqConfig,
];

export {
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  mailConfig,
  razorpayConfig,
  rabbitmqConfig,
};
