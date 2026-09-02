import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './core/redis/redis.module';

import { ConfigService } from '@nestjs/config';

import { SessionModule } from './modules/session/session.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { LoggerMiddleware } from './core/middleware/logger.middleware';
import { CONSOLE_COLORS, MODULE_PREFIXES } from './core/constants/colors';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    SessionModule,
    ThrottlerModule.forRoot([{
      ttl: 900000,
      limit: 3,
    }]),
    UsersModule,
    TenantsModule,
    AuthModule,
    PaymentsModule,
    SubscriptionsModule,
    OrdersModule,
    TransactionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
