export interface AppConfig {
  name: string;
  env: string;
  port: number;
  prefix: string;
}

export interface DatabaseConfig {
  url: string;
  poolSize: number;
  ssl: boolean;
}

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTokenExpiresIn: string;
  refreshTokenExpiresIn: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export interface MailConfig {
  apiKey: string;
  fromEmail: string;
}

export interface AllConfig {
  app: AppConfig;
  database: DatabaseConfig;
  jwt: JwtConfig;
  redis: RedisConfig;
  mail: MailConfig;
}
