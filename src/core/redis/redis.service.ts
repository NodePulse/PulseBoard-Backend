import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisConfig } from '../../config/config.interface';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  public client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const config = this.configService.get<RedisConfig>('redis');
    if (!config) {
      throw new Error('Redis configuration not found');
    }

    const logger = this.logger;
    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password || undefined,
      tls: ['localhost', '127.0.0.1'].includes(config.host)
        ? undefined
        : { servername: config.host },
      retryStrategy(times) {
        logger.warn(`Connection lost. Retrying connection (attempt ${times})...`);
        return Math.min(times * 100, 10000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log('Client connection established.');
    });

    this.client.on('ready', () => {
      this.logger.log('Client connection is ready.');
    });

    this.client.on('error', (err) => {
      this.logger.error('Client error:', err);
    });

    this.client.on('close', () => {
      this.logger.warn('Client connection closed.');
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.client.exists(key);
    return result === 1;
  }
}
