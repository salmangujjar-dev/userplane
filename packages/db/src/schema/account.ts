import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { user } from './user';

export const account = pgTable(
  'account',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // User relationship
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    // Provider configuration
    providerId: text('provider_id').notNull(),
    accountId: text('account_id').notNull(),

    // OAuth tokens
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),

    // Email/password authentication
    password: text('password'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)]
);
