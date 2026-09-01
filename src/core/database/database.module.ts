import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DatabaseConfig } from '../../config/config.interface';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<DatabaseConfig>('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }

        let url = dbConfig.url;
        const wantsSsl = url?.includes('sslmode=require') || dbConfig.ssl;
        if (url) {
          url = url
            .replace('?sslmode=require', '')
            .replace('&sslmode=require', '');
        }

        return {
          type: 'postgres',
          url: url,
          extra: {
            max: dbConfig.poolSize,
          },
          ssl: wantsSsl
            ? {
                rejectUnauthorized: false,
              }
            : undefined,
          autoLoadEntities: true,
          synchronize: configService.get<string>('app.env') === 'development',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
