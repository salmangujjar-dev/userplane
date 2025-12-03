import { pgTable, text, timestamp, boolean, index, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workspaces } from './workspaces';
import { recordingLinks } from './recording-links';

export const domainStatusEnum = pgEnum('domain_status', ['pending', 'verified', 'revoked']);

export const domains = pgTable(
  'domains',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Workspace relationship
    workspaceId: text('workspace_id').notNull(),

    // Domain configuration
    domainUrl: text('domain_url').notNull(),
    domainStatus: domainStatusEnum('domain_status').notNull().default('pending'),

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
  ]
);

export const domainsRelations = relations(domains, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [domains.workspaceId],
    references: [workspaces.id],
  }),
  recordingLinks: many(recordingLinks),
}));
