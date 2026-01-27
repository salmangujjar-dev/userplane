import { relations } from 'drizzle-orm';
import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { workspaces } from './workspaces';

/**
 * Intercom region enum
 * Regional API endpoints: US (api.intercom.io), EU (api.eu.intercom.io), AU (api.au.intercom.io)
 */
export const INTERCOM_REGION_VALUES = ['US', 'EU', 'AU'] as const;
export type IntercomRegion = (typeof INTERCOM_REGION_VALUES)[number];
export const intercomRegionEnum = pgEnum('intercom_region', INTERCOM_REGION_VALUES);

/**
 * Intercom integrations table
 * Stores OAuth tokens and workspace mapping for Intercom connections
 */
export const intercomIntegrations = pgTable(
  'intercom_integrations',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Reference to our workspace
    // No cascade delete - use soft delete on integrations instead
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId),

    // Intercom workspace identifier (app.id_code) - prevents duplicate connections
    intercomWorkspaceId: text('intercom_workspace_id').notNull(),

    // OAuth access token (no refresh tokens for Intercom - valid until user revokes)
    accessToken: text('access_token').notNull(),

    // Regional API endpoint
    region: intercomRegionEnum('region').notNull().default('US'),

    // Admin who connected the integration
    adminId: text('admin_id').notNull(),
    adminEmail: text('admin_email').notNull(),
    adminName: text('admin_name'),

    // Intercom app details
    appIdCode: text('app_id_code').notNull(),
    appName: text('app_name'),

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
    // Unique constraint on Intercom workspace ID to prevent duplicate connections
    // Includes isDeleted to allow re-connecting after soft delete
    uniqueIndex('intercom_integrations_intercom_workspace_id_idx').on(
      table.intercomWorkspaceId,
      table.isDeleted
    ),
    // Index for workspace lookups
    index('intercom_integrations_workspace_id_idx').on(table.workspaceId),
  ]
);

export const intercomIntegrationsRelations = relations(intercomIntegrations, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [intercomIntegrations.workspaceId],
    references: [workspaces.workspaceId],
  }),
}));
