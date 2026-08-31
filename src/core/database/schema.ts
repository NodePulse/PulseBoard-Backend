import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(), // UUID
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').references(() => tenants.id, {
    onDelete: 'cascade',
  }),
  email: text('email').notNull(),
  passwordHash: text('password_hash'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  avatarUrl: text('avatar_url'),
  isEmailVerified: integer('is_email_verified', { mode: 'boolean' }).default(
    false,
  ),
  verificationToken: text('verification_token').unique(),
  verificationOtp: text('verification_otp'),
  verificationExpiresAt: text('verification_expires_at'),
  workspaceRole: text('workspace_role').default('member'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  deletedAt: text('deleted_at'),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  refreshToken: text('refresh_token').notNull(),
  userAgent: text('user_agent'),
  ipAddress: text('ip_address'),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const subscriptions = sqliteTable('subscriptions', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  planId: text('plan_id').notNull(),
  status: text('status').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  currentPeriodStart: text('current_period_start'),
  currentPeriodEnd: text('current_period_end'),
  cancelAtPeriodEnd: integer('cancel_at_period_end', {
    mode: 'boolean',
  }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// We can add other tables here (transactions, payments, orders, notifications) as needed.
