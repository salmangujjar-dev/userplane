import { pgTable, text, timestamp, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from './projects';

export const storeProviderEnum = pgEnum('store_provider', ['r2', 's3']);

export const stores = pgTable('stores', {
  // Primary identifier
  id: text('id').primaryKey(),

  // Provider configuration
  provider: storeProviderEnum('provider').notNull(),
  providerUrl: text('provider_url').notNull(),

  // Provider credentials (encrypted)
  providerAccessId: text('provider_access_id').notNull(),
  providerAccessKey: text('provider_access_key').notNull(),

  // Provider-specific metadata
  providerMeta: jsonb('provider_meta'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),

  // Soft delete
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at'),
});

export const storesRelations = relations(stores, ({ many }) => ({
  projects: many(projects),
}));
