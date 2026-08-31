import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../src/core/database/data-source';

async function generateMigration() {
  await AppDataSource.initialize();

  // Get the SQL queries for schema updates
  const sqlInMemory = await AppDataSource.driver.createSchemaBuilder().log();

  if (sqlInMemory.upQueries.length === 0) {
    console.log('No schema changes detected.');
    process.exit(0);
  }

  // Create migrations directory if it doesn't exist
  const migrationsDir = path.join(__dirname, '../migrations');
  if (!fs.existsSync(migrationsDir)) {
    fs.mkdirSync(migrationsDir);
  }

  // Format migration filename (e.g., 0002_migration-name.sql)
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  const nextNumber =
    files.length > 0
      ? Math.max(...files.map((f) => parseInt(f.split('_')[0]) || 0)) + 1
      : 1;

  const migrationName = process.argv[2] || 'auto-migration';
  const paddedNumber = String(nextNumber).padStart(4, '0');
  const filename = `${paddedNumber}_${migrationName}.sql`;
  const filepath = path.join(migrationsDir, filename);

  // Write queries to file
  const sql = sqlInMemory.upQueries.map((q) => q.query + ';').join('\n\n');
  fs.writeFileSync(filepath, sql);

  // Sync the local shadow database so future migrations are incremental
  for (const query of sqlInMemory.upQueries) {
    await AppDataSource.query(query.query, query.parameters);
  }

  console.log(`\n✅ Migration generated successfully: migrations/${filename}`);
  console.log(
    `\nTo apply locally: npx wrangler d1 migrations apply pulseboard-db --local`,
  );
  console.log(
    `To apply remotely: npx wrangler d1 migrations apply pulseboard-db --remote\n`,
  );

  process.exit(0);
}

generateMigration().catch((err) => {
  console.error('Error generating migration:', err);
  process.exit(1);
});
