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
    expiresAt: timestamp('expires_at').notNull(),

    // Client information
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    // Impersonation (admin plugin)
    impersonatedBy: text('impersonated_by'),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('session_userId_idx').on(table.userId)]
);
