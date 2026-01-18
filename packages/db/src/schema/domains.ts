import { relations } from 'drizzle-orm';
import { boolean, index, pgEnum, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

import { DOMAIN_STATUS_VALUES } from '../constants';
import { links } from './links';
import { workspaces } from './workspaces';

export const domainStatusEnum = pgEnum('domain_status', DOMAIN_STATUS_VALUES);

export const domains = pgTable(
  'domains',
  {
    // Primary identifier
    domainId: text('domain_id').primaryKey(),

    // Workspace relationship
    workspaceId: text('workspace_id').notNull(),

    // Domain configuration
    domainUrl: text('domain_url').notNull(),
    domainStatus: domainStatusEnum('domain_status').notNull().default('pending'),

    // Recording toggles
    recordingHideSensitive: boolean('recording_hide_sensitive').default(false).notNull(),
    recordingCaptureClientLog: boolean('recording_capture_client_log').default(false).notNull(),
    recordingCaptureClientAction: boolean('recording_capture_client_action')
      .default(false)
      .notNull(),
    recordingCaptureServerLog: boolean('recording_capture_server_log').default(false).notNull(),
    recordingCaptureNetworkLog: boolean('recording_capture_network_log').default(false).notNull(),

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
    index('domains_workspace_status_idx').on(table.workspaceId, table.domainStatus),
    index('domains_domain_url_idx').on(table.domainUrl),
    unique('domains_workspace_url_unique').on(table.workspaceId, table.domainUrl, table.isDeleted),
  ]
);

export const domainsRelations = relations(domains, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [domains.workspaceId],
    references: [workspaces.workspaceId],
  }),
  links: many(links),
}));
