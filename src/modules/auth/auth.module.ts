import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { ConfigModule } from '@nestjs/config';
import { Session } from './entities/session.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../../core/redis/redis.module';
import { MailModule } from 'src/core/mail/mail.module';
import { SessionModule } from '../session/session.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([Session]),
    ConfigModule,
    RedisModule,
    MailModule,
    SessionModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
