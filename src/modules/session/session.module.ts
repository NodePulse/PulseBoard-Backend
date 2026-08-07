import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../auth/entities/session.entity';
import { RedisModule } from '../../core/redis/redis.module';
import { SessionCacheService } from './session-cache.service';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), RedisModule],
  providers: [SessionCacheService],
  exports: [SessionCacheService],
})
export class SessionModule {}
