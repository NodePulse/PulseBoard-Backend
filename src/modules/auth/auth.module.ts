import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenSession } from './entities/refresh-token-session.entity';
import { JwtModule } from '@nestjs/jwt';
import { MailModule } from '../../core/mail/mail.module';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([RefreshTokenSession]),
    JwtModule.register({}),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule { }
