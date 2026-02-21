import type { LinkProviderType, LinkType } from '@workspace/contract';
import { relations, sql } from 'drizzle-orm';
import { boolean, check, index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { LINK_PROVIDER_TYPE_VALUES, LINK_TYPE_VALUES } from '../constants';
import { domains } from './domains';
import { projects } from './projects';
import { recordings } from './recordings';
import { workspaceMembers } from './workspace-members';
import { workspaces } from './workspaces';

// FTS Index Requirement for Link Search
// The link search feature uses PostgreSQL Full-Text Search (FTS) with to_tsvector/to_tsquery
// For optimal performance, create a GIN index on linkTitle tsvector:
// CREATE INDEX links_link_title_gin_idx ON recording_links USING GIN (to_tsvector('simple', COALESCE(link_title, '')));
// This index significantly improves search performance for higher volume link tables

export const links = pgTable(
  'recording_links',
  {
    // Primary identifier
    linkId: text('link_id').primaryKey(),

    // Relationships
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'restrict' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.projectId, { onDelete: 'restrict' }),
    domainId: text('domain_id')
      .notNull()
      .references(() => domains.domainId, { onDelete: 'restrict' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => workspaceMembers.workspaceMemberId, { onDelete: 'restrict' }),

    // Link configuration
    linkTitle: text('link_title'),
    linkReusable: boolean('link_reusable').default(false).notNull(),
    linkType: text('link_type').$type<LinkType>().default('recording').notNull(),

    // External integration metadata
    linkProviderType: text('link_provider_type').$type<LinkProviderType>().default('web').notNull(),
    linkProviderId: text('link_provider_id'),
    linkProviderRef: text('link_provider_ref'),
    linkProviderData: jsonb('link_provider_data'),

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
    index('recording_links_workspace_id_idx').on(table.workspaceId),
    index('recording_links_domain_id_idx').on(table.domainId),
    index('recording_links_created_by_idx').on(table.createdBy),
    index('recording_links_workspace_created_at_idx').on(table.workspaceId, table.createdAt),
    index('recording_links_provider_idx').on(table.linkProviderType, table.linkProviderId),
    index('recording_links_link_type_idx').on(table.linkType),
    // Partial index for soft-delete filtering
    index('recording_links_active_workspace_created_idx')
      .on(table.workspaceId, table.createdAt)
      .where(sql`${table.isDeleted} = false`),
    // Composite indexes for hot query paths
    index('recording_links_project_deleted_idx').on(table.projectId, table.isDeleted),
    index('recording_links_domain_deleted_idx').on(table.domainId, table.isDeleted),
    check(
      'recording_links_link_type_check',
      sql`${table.linkType} IN (${sql.raw(LINK_TYPE_VALUES.map((v) => `'${v}'`).join(', '))})`
    ),
    check(
      'recording_links_link_provider_type_check',
      sql`${table.linkProviderType} IN (${sql.raw(LINK_PROVIDER_TYPE_VALUES.map((v) => `'${v}'`).join(', '))})`
    ),
  ]
);

export const linksRelations = relations(links, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [links.workspaceId],
    references: [workspaces.workspaceId],
  }),
  project: one(projects, {
    fields: [links.projectId],
    references: [projects.projectId],
  }),
  domain: one(domains, {
    fields: [links.domainId],
    references: [domains.domainId],
  }),
  creator: one(workspaceMembers, {
    fields: [links.createdBy],
    references: [workspaceMembers.workspaceMemberId],
  }),
  recordings: many(recordings),
}));
