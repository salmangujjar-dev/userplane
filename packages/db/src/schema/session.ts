import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { user } from './user';

export const session = pgTable(
  'session',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // User relationship
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),

    // Session configuration
    token: text('token').notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    // Client information
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    // Impersonation (admin plugin)
    impersonatedBy: text('impersonated_by'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('session_userId_idx').on(table.userId),
    // Composite index for active session filtering
    index('session_user_expires_idx').on(table.userId, table.expiresAt),
  ]
);
