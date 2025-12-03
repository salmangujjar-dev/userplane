import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workspaces } from './workspaces';
import { recordingLinks } from './recording-links';
import { recordings } from './recordings';

export const projects = pgTable(
  'projects',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Relationships
    workspaceId: text('workspace_id').notNull(),

    // Project configuration
    projectTitle: text('project_title'),
    projectPath: text('project_path').notNull(),
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
    references: [workspaces.id],
  }),
  recordingLinks: many(recordingLinks),
  recordings: many(recordings),
}));
