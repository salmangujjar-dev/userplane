import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const verification = pgTable(
  'verification',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Verification configuration
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
);
