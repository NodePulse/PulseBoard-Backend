import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

let url = process.env.DATABASE_URL;
if (url) {
  url = url.replace('?sslmode=require', '').replace('&sslmode=require', '');
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: url,
  ssl: {
    rejectUnauthorized: false,
  },
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/core/database/postgres-migrations/*.ts'],
});
