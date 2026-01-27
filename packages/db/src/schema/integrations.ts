import { relations } from 'drizzle-orm';
import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { workspaces } from './workspaces';

/**
 * Integrations table
 * Stores OAuth tokens and workspace mapping for third-party integrations
 * Provider types, token schemas, and metadata schemas are defined in @workspace/contract
 * Each provider defines its own token structure - no separate token type field needed
 */
export const integrations = pgTable(
  'integrations',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Reference to our workspace
    // No cascade delete - use soft delete on integrations instead
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId),

    // Integration provider (intercom, zendesk, etc.)
    // Stored as text for flexibility - validated via contract schemas
    // The provider determines both token and metadata structure
    provider: text('provider').notNull(),

    // Provider workspace identifier - prevents duplicate connections
    providerWorkspaceId: text('provider_workspace_id').notNull(),

    // Provider token data (structure determined by provider)
    // Type is validated via contract schemas based on provider
    // E.g., intercom: { accessToken }, oauth2: { accessToken, refreshToken, expiresAt }
    providerToken: jsonb('provider_token').notNull(),

    // Provider-specific metadata (region, settings, etc.)
    // Type is validated via contract schemas based on provider
    providerMeta: jsonb('provider_meta').notNull(),

    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    // Unique constraint on provider workspace ID to prevent duplicate connections
    // Includes provider and isDeleted to allow re-connecting after soft delete
    uniqueIndex('integrations_provider_workspace_id_idx').on(
      table.provider,
      table.providerWorkspaceId,
      table.isDeleted
    ),
    // Index for workspace lookups
    index('integrations_workspace_id_idx').on(table.workspaceId),
  ]
);

export const integrationsRelations = relations(integrations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [integrations.workspaceId],
    references: [workspaces.workspaceId],
  }),
}));
