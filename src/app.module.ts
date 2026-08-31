import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
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
import { LoggerMiddleware } from './core/middleware/logger.middleware';
import { CONSOLE_COLORS, MODULE_PREFIXES } from './core/constants/colors';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    SessionModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('redis');
        console.log('BullMQ Redis Config:', config);
        return {
          connection: {
            host: config.host,
            port: config.port,
            password: config.password || undefined,
            tls: ['localhost', '127.0.0.1'].includes(config.host)
              ? undefined
              : { servername: config.host },
            enableReadyCheck: false,
            family: 0,
            keepAlive: 10000,
            skipVersionCheck: true,
            maxRetriesPerRequest: null,
            retryStrategy(times) {
              console.warn(
                `${MODULE_PREFIXES.BULLMQ} ${CONSOLE_COLORS.YELLOW}Redis connection lost. Retrying connection (attempt ${times})...${CONSOLE_COLORS.RESET}`,
              );
              return Math.min(times * 100, 10000);
            },
          },
        };
      },
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
