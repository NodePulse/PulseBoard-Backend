import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenSession } from '../auth/entities/refresh-token-session.entity';
import { RedisModule } from '../../core/redis/redis.module';
import { SessionCacheService } from './session-cache.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([RefreshTokenSession]), RedisModule],
  providers: [SessionCacheService],
  exports: [SessionCacheService],
})
export class SessionModule {}
