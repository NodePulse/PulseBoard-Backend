import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import * as fs from 'fs';
import * as path from 'path';

export const DRIZZLE = Symbol('drizzle-connection');

function getD1DatabasePath() {
  const d1Dir = path.join(process.cwd(), '.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  if (fs.existsSync(d1Dir)) {
    const files = fs.readdirSync(d1Dir);
    const sqliteFiles = files
      .filter(f => f.endsWith('.sqlite') && f !== 'metadata.sqlite')
      .map(f => ({ name: f, time: fs.statSync(path.join(d1Dir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);
    if (sqliteFiles.length > 0) {
      return path.join(d1Dir, sqliteFiles[0].name);
    }
  }
  return 'database.sqlite'; // Fallback
}

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbPath = getD1DatabasePath();
        const sqlite = new Database(dbPath);
        return drizzle(sqlite, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
