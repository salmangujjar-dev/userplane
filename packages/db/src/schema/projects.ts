import { relations } from 'drizzle-orm';
import { boolean, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { links } from './links';
import { recordings } from './recordings';
import { workspaces } from './workspaces';

export const projects = pgTable(
  'projects',
  {
    // Primary identifier
    projectId: text('project_id').primaryKey(),

    // Relationships
    workspaceId: text('workspace_id').notNull(),

    // Project configuration
    projectTitle: text('project_title').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),

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
  (table) => [index('projects_workspace_id_idx').on(table.workspaceId)]
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.workspaceId],
  }),
  links: many(links),
  recordings: many(recordings),
}));
