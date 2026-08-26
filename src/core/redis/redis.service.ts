import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisConfig } from '../../config/config.interface';
import { CONSOLE_COLORS, MODULE_PREFIXES } from '../constants/colors';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const config = this.configService.get<RedisConfig>('redis');
    if (!config) {
      throw new Error('Redis configuration not found');
    }

    this.client = new Redis({
      host: config.host,
      port: config.port,
      password: config.password || undefined,
      tls: ['localhost', '127.0.0.1'].includes(config.host)
        ? undefined
        : { servername: config.host },
      retryStrategy(times) {
        console.warn(
          `${MODULE_PREFIXES.REDIS} ${CONSOLE_COLORS.YELLOW}Connection lost. Retrying connection (attempt ${times})...${CONSOLE_COLORS.RESET}`,
        );
        return Math.min(times * 100, 10000);
      },
    });

    this.client.on('connect', () => {
      console.log(`${MODULE_PREFIXES.REDIS} ${CONSOLE_COLORS.GREEN}Client connection established.${CONSOLE_COLORS.RESET}`);
    });

    this.client.on('ready', () => {
      console.log(`${MODULE_PREFIXES.REDIS} ${CONSOLE_COLORS.GREEN}Client connection is ready.${CONSOLE_COLORS.RESET}`);
    });

    this.client.on('error', (err) => {
      console.error(`${MODULE_PREFIXES.REDIS} ${CONSOLE_COLORS.RED}Client error:${CONSOLE_COLORS.RESET}`, err);
    });

    this.client.on('close', () => {
      console.warn(`${MODULE_PREFIXES.REDIS} ${CONSOLE_COLORS.YELLOW}Client connection closed.${CONSOLE_COLORS.RESET}`);
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
