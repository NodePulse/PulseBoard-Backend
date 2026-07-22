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
                return {
                    type: 'postgres',
                    url: dbConfig.url,
                    extra: {
                        max: dbConfig.poolSize,
                    },
                    ssl: dbConfig.ssl
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
export class DatabaseModule { }
