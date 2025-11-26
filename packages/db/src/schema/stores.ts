import { pgTable, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { projects } from './projects';
import { workspaces } from './workspaces';

export const storeProviderEnum = pgEnum('store_provider', ['r2', 's3']);

export const stores = pgTable('stores', {
  // Primary identifier
  id: text('id').primaryKey(),

  // Workspace relationship
  workspaceId: text('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),

  // Store identity
  storeTitle: text('store_title').notNull(),

  // Provider configuration
  provider: storeProviderEnum('provider').notNull(),
  providerUrl: text('provider_url').notNull(),
  providerRegion: text('provider_region').notNull(),
  providerBucket: text('provider_bucket').notNull(),

  // Provider credentials (encrypted)
  providerAccessId: text('provider_access_id').notNull(),
  providerAccessKey: text('provider_access_key').notNull(),

  // Store management
  storeIsManaged: boolean('store_is_managed').notNull().default(true),

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

export const storesRelations = relations(stores, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [stores.workspaceId],
    references: [workspaces.id],
  }),
  projects: many(projects),
}));
