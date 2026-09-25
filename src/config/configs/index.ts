import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import mailConfig from './mail.config';
import cashfreeConfig from './cashfree.config';

import rabbitmqConfig from './rabbitmq.config';

export default [
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  mailConfig,
  cashfreeConfig,
  rabbitmqConfig,
];

export {
  appConfig,
  databaseConfig,
  jwtConfig,
  redisConfig,
  mailConfig,
  cashfreeConfig,
  rabbitmqConfig,
};
