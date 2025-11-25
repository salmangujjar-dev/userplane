import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workspaces } from './workspaces';
import { projects } from './projects';
import { workspaceMembers } from './workspace-members';
import { recordings } from './recordings';

export const providerTypeEnum = pgEnum('provider_type', ['zendesk', 'intercom', 'plain']);

export const recordingLinks = pgTable(
  'recording_links',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Relationships
    workspaceId: text('workspace_id').notNull(),
    projectId: text('project_id').notNull(),
    createdBy: text('created_by').notNull(),

    // Link configuration
    linkPublicUri: text('link_public_uri').notNull(),
    linkTitle: text('link_title'),
    linkReusable: boolean('link_reusable').default(false).notNull(),

    // External integration metadata
    providerType: providerTypeEnum('provider_type'),
    providerId: text('provider_id'),
    providerUrl: text('provider_url'),
    providerData: jsonb('provider_data'),

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
    uniqueIndex('recording_links_link_public_uri_idx').on(table.linkPublicUri),
    index('recording_links_workspace_id_idx').on(table.workspaceId),
    index('recording_links_created_by_idx').on(table.createdBy),
    index('recording_links_workspace_created_at_idx').on(table.workspaceId, table.createdAt),
    index('recording_links_provider_idx').on(table.providerType, table.providerId),
  ]
);

export const recordingLinksRelations = relations(recordingLinks, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [recordingLinks.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [recordingLinks.projectId],
    references: [projects.id],
  }),
  creator: one(workspaceMembers, {
    fields: [recordingLinks.createdBy],
    references: [workspaceMembers.id],
  }),
  recordings: many(recordings),
}));
