import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './core/redis/redis.module';

@Module({
  imports: [AppConfigModule, DatabaseModule, RedisModule, UsersModule, TenantsModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule { }
