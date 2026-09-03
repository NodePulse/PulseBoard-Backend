import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from '../../core/redis/redis.service';
import { Session } from '../auth/entities/session.entity';

export interface CachedSession {
  id: string;
  userId: string;
  status: string;
  deviceName: string | null;
  expiresAt: string;
}

@Injectable()
export class SessionCacheService {
  constructor(
    private readonly redisService: RedisService,
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
  ) {}

  private getSessionKey(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private getUserSessionsKey(userId: string): string {
    return `user_sessions:${userId}`;
  }

  async set(session: Session): Promise<void> {
    const key = this.getSessionKey(session.id);
    const userKey = this.getUserSessionsKey(session.userId);

    const data: CachedSession = {
      id: session.id,
      userId: session.userId,
      status: session.status,
      deviceName: session.deviceName,
      expiresAt: session.expiresAt.toISOString(),
    };

    const ttl = Math.max(
      0,
      Math.floor((session.expiresAt.getTime() - Date.now()) / 1000),
    );

    // Cache session payload
    await this.redisService.set(key, JSON.stringify(data), ttl);

    // Add session ID to the user sessions set
    await this.redisService.client.sadd(userKey, session.id);
    // Keep set TTL aligned with session expiry
    await this.redisService.client.expire(userKey, ttl);
  }

  async get(sessionId: string): Promise<CachedSession | null> {
    const key = this.getSessionKey(sessionId);
    const cached = await this.redisService.get(key);

    if (cached) {
      try {
        return JSON.parse(cached) as CachedSession;
      } catch {
        // Fallback on JSON parse error
      }
    }

    // Cache miss, fallback to database
    return this.reloadFromDb(sessionId);
  }

  async reloadFromDb(sessionId: string): Promise<CachedSession | null> {
    const session = await this.sessionRepository.findOne({
      where: { id: sessionId },
    });

    if (
      !session ||
      session.revokedAt !== null ||
      session.status !== 'ACTIVE' ||
      session.expiresAt < new Date()
    ) {
      return null;
    }

    await this.set(session);

    return {
      id: session.id,
      userId: session.userId,
      status: session.status,
      deviceName: session.deviceName,
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async invalidate(sessionId: string, userId: string): Promise<void> {
    const key = this.getSessionKey(sessionId);
    const userKey = this.getUserSessionsKey(userId);

    await this.redisService.del(key);
    await this.redisService.client.srem(userKey, sessionId);
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    const userKey = this.getUserSessionsKey(userId);
    const sessionIds = await this.redisService.client.smembers(userKey);

    if (sessionIds.length > 0) {
      const keys = sessionIds.map((id) => this.getSessionKey(id));
      await this.redisService.client.del(...keys);
    }

    await this.redisService.del(userKey);
  }
}
