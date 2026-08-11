import { Module } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { RedisModule } from './core/redis/redis.module';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

import { SessionModule } from './modules/session/session.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { OrdersModule } from './modules/orders/orders.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    SessionModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          password: configService.get<string>('redis.password'),
          tls: { servername: configService.get<string>('redis.host') },
          maxRetriesPerRequest: null,
          retryStrategy(times) {
            console.warn(
              `[BullMQ] Redis connection lost. Retrying connection (attempt ${times})...`,
            );
            return Math.min(times * 100, 10000);
          },
        },
      }),
    }),
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
export class AppModule {}
