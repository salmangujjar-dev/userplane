import { relations, sql } from 'drizzle-orm';
import { boolean, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { links } from './links';
import { recordings } from './recordings';
import { workspaces } from './workspaces';

export const projects = pgTable(
  'projects',
  {
    // Primary identifier
    projectId: text('project_id').primaryKey(),

    // Relationships
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'restrict' }),

    // Project configuration
    projectTitle: text('project_title').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    recordingRetentionDays: integer('recording_retention_days').notNull().default(30),

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
    index('projects_workspace_id_idx').on(table.workspaceId),
    // Partial index for soft-delete filtering
    index('projects_active_workspace_created_idx')
      .on(table.workspaceId, table.createdAt)
      .where(sql`${table.isDeleted} = false`),
  ]
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.workspaceId],
  }),
  links: many(links),
  recordings: many(recordings),
}));
