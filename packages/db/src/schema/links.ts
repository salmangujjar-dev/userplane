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
import { domains } from './domains';

// Link types - currently only 'recording' is supported in the API
// Other types (file, session, screenshot) are reserved for future use
export const linkTypeEnum = pgEnum('link_type', ['file', 'recording', 'session', 'screenshot']);

export const linkProviderTypeEnum = pgEnum('link_provider_type', [
  // Support/Helpdesk
  'intercom',
  'zendesk',
  'hubspot',
  'freshdesk',
  'freshchat',
  'jira_service_management',
  'helpscout',
  'happyfox',
  'ada',
  'forethought',
  'servicenow',
  'front',
  'zoho_desk',
  'crisp',
  'pylon',
  'plain',
  // Project Management / Dev Tools
  'asana',
  'azure_devops',
  'clickup',
  'github',
  'gitlab',
  'jira',
  'linear',
  'notion',
  'sentry',
  'slack',
  // Fallback
  'web', // Valid URL but unknown provider
  'others', // Not a URL (plain text)
]);

export const links = pgTable(
  'recording_links',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Relationships
    workspaceId: text('workspace_id').notNull(),
    projectId: text('project_id').notNull(),
    domainId: text('domain_id').notNull(),
    createdBy: text('created_by').notNull(),

    // Link configuration
    // linkGUID is immutable - set once at creation
    linkGUID: text('link_guid').notNull(),
    linkTitle: text('link_title'),
    linkReusable: boolean('link_reusable').default(false).notNull(),
    linkType: linkTypeEnum('link_type').default('recording').notNull(),

    // External integration metadata
    linkProviderType: linkProviderTypeEnum('link_provider_type'),
    linkProviderId: text('link_provider_id'),
    linkProviderRef: text('link_provider_ref'),
    linkProviderData: jsonb('link_provider_data'),

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
    uniqueIndex('recording_links_link_guid_idx').on(table.linkGUID),
    index('recording_links_workspace_id_idx').on(table.workspaceId),
    index('recording_links_domain_id_idx').on(table.domainId),
    index('recording_links_created_by_idx').on(table.createdBy),
    index('recording_links_workspace_created_at_idx').on(table.workspaceId, table.createdAt),
    index('recording_links_provider_idx').on(table.linkProviderType, table.linkProviderId),
    index('recording_links_link_type_idx').on(table.linkType),
  ]
);

export const linksRelations = relations(links, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [links.workspaceId],
    references: [workspaces.id],
  }),
  project: one(projects, {
    fields: [links.projectId],
    references: [projects.id],
  }),
  domain: one(domains, {
    fields: [links.domainId],
    references: [domains.id],
  }),
  creator: one(workspaceMembers, {
    fields: [links.createdBy],
    references: [workspaceMembers.id],
  }),
  recordings: many(recordings),
}));
