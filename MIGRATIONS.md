# Database Migrations with Cloudflare D1

This project uses TypeORM to define the data models, but runs on Cloudflare D1 (SQLite) as the actual database engine. Because D1 requires pure SQL migration files, we have a custom workflow to generate those SQL files from our TypeORM entities.

## Step-by-Step Migration Guide

Whenever you make changes to your database schema (such as updating, adding, or deleting a column/table in your `src/modules/**/entities/*.entity.ts` files), follow these steps to apply those changes.

### Step 1: Update your Entity Files
Modify your TypeORM entity files as usual. For example, add a new column to `user.entity.ts`:
```typescript
@Column({ type: 'varchar', nullable: true })
newField: string;
```
*(Note: Be sure to use SQLite-compatible types. For example, use `varchar` instead of `enum`, and `datetime` instead of `timestamp` or `timestamptz`)*.

### Step 2: Generate the Migration File
Run the migration generator script, providing a descriptive name for your change:

```bash
npm run d1:migration:generate "add-user-newfield"
```

This script will:
1. Load your local TypeORM setup.
2. Compare your current entity files against the existing local database schema.
3. Output the exact SQL commands needed to bridge the gap.
4. Save those SQL commands directly into the `migrations/` folder (e.g., `migrations/0002_add-user-newfield.sql`).

**Important**: Always open the newly generated `.sql` file in the `migrations/` folder to double-check that the SQL commands look correct.

### Step 3: Apply the Migration Locally (Development)
Test the migration against your local `.wrangler` database state before deploying to production:

```bash
npm run d1:migration:apply:local
```

### Step 4: Apply the Migration Remotely (Production)
Once you're satisfied that the local migration works and your code runs without issues, apply the schema changes to your live Cloudflare D1 database:

```bash
npm run d1:migration:apply:remote
```

---

## Troubleshooting

- **No schema changes detected**: If the generator script says this, make sure you actually exported your Entity and added it to the TypeORM entities array in `data-source.ts`.
- **Unsupported ALTER TABLE operations**: SQLite (and D1) does not support all `ALTER TABLE` commands natively (e.g., dropping columns directly is complex). If TypeORM generates complex table recreations, carefully review the `.sql` file to ensure no data will be unintentionally dropped.
