import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  // Primary identifier
  id: text('id').primaryKey(),

  // User profile
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),

  // Admin plugin fields
  role: text('role').default('user'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires', { withTimezone: true }),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
