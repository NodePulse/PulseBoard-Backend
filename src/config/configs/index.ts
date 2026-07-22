import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import mailConfig from './mail.config';

export default [appConfig, databaseConfig, jwtConfig, redisConfig, mailConfig];

export { appConfig, databaseConfig, jwtConfig, redisConfig, mailConfig };
