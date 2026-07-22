import * as Joi from 'joi';

export default Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').required(),

  APP_NAME: Joi.string().required(),

  PORT: Joi.number().required(),

  API_PREFIX: Joi.string().required(),

  DATABASE_URL: Joi.string().required(),

  DB_POOL_SIZE: Joi.number().default(10),

  DB_SSL: Joi.boolean().default(false),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),

  JWT_REFRESH_SECRET: Joi.string().min(32).required(),

  JWT_ACCESS_EXPIRES_IN: Joi.string().required(),

  JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

  REDIS_HOST: Joi.string().required(),

  REDIS_PORT: Joi.number().required(),

  REDIS_PASSWORD: Joi.allow('').optional(),

  RESEND_API_KEY: Joi.string().required(),

  RESEND_FROM_EMAIL: Joi.string().email().required(),
});
