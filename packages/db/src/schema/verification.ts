import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const verification = pgTable(
  'verification',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Verification configuration
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
);
