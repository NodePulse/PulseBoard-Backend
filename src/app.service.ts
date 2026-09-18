import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RedisService } from './core/redis/redis.service';

export interface HealthStatusResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
  };
}

@Injectable()
export class AppService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly redisService: RedisService,
  ) {}

  public async getHealth(): Promise<HealthStatusResponse> {
    let dbStatus: 'up' | 'down' = 'down';
    let redisStatus: 'up' | 'down' = 'down';

    try {
      await this.dataSource.query('SELECT 1');
      dbStatus = 'up';
    } catch (error) {
      dbStatus = 'down';
    }

    try {
      const ping = await this.redisService.client.ping();
      if (ping === 'PONG') {
        redisStatus = 'up';
      }
    } catch (error) {
      redisStatus = 'down';
    }

    const isHealthy = dbStatus === 'up' && redisStatus === 'up';
    const isDegraded =
      (dbStatus === 'up' || redisStatus === 'up') && !isHealthy;

    return {
      status: isHealthy ? 'ok' : isDegraded ? 'degraded' : 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbStatus,
        redis: redisStatus,
      },
    };
  }
}
