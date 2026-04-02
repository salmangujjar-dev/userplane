import { relations, sql } from 'drizzle-orm';
import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { workspaceMembers } from './workspace-members';
import { workspaces } from './workspaces';

/**
 * Workspace member identities table
 * Stores provider-specific external identity data per workspace member.
 * Provider types and metadata schemas are defined in @userplane/contract.
 * Each provider stores its own metadata structure (including external user ID)
 * inside the providerMeta JSONB column — same pattern as the integrations table.
 */
export const workspaceMemberIdentities = pgTable(
  'workspace_member_identities',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Reference to workspace member
    workspaceMemberId: text('workspace_member_id')
      .notNull()
      .references(() => workspaceMembers.workspaceMemberId, { onDelete: 'restrict' }),

    // Reference to workspace (denormalized for efficient workspace-scoped queries)
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'restrict' }),

    // Identity provider (slack, etc.)
    // Stored as text for flexibility — validated via contract schemas
    provider: text('provider').notNull(),

    // Provider-specific metadata (structure determined by provider)
    // Includes the external user ID and any additional context
    // E.g., slack: { userId, teamId, email }
    providerMeta: jsonb('provider_meta').notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),

    // Soft delete
    isDeleted: boolean('is_deleted').default(false).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    // Only ONE active identity per member-provider combination
    // Allows re-creation after soft delete (e.g., re-enabling Slack channel)
    uniqueIndex('workspace_member_identities_active_member_provider_idx')
      .on(table.workspaceMemberId, table.provider)
      .where(sql`${table.isDeleted} = false`),
    // Index for workspace-scoped queries (e.g., cascade delete/restore)
    index('workspace_member_identities_workspace_id_idx').on(table.workspaceId),
    // Index for workspace + provider queries (e.g., disconnect cleanup)
    index('workspace_member_identities_workspace_provider_idx')
      .on(table.workspaceId, table.provider)
      .where(sql`${table.isDeleted} = false`),
  ]
);

export const workspaceMemberIdentitiesRelations = relations(
  workspaceMemberIdentities,
  ({ one }) => ({
    member: one(workspaceMembers, {
      fields: [workspaceMemberIdentities.workspaceMemberId],
      references: [workspaceMembers.workspaceMemberId],
    }),
    workspace: one(workspaces, {
      fields: [workspaceMemberIdentities.workspaceId],
      references: [workspaces.workspaceId],
    }),
  })
);
