import { pgTable, text, timestamp, boolean, index, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './user';
import { workspaces } from './workspaces';
import { recordingLinks } from './recording-links';
import { recordings } from './recordings';

export const workspaceRoleEnum = pgEnum('workspace_role', ['owner', 'admin', 'member']);

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Relationships
    userId: text('user_id').notNull(),
    workspaceId: text('workspace_id').notNull(),

    // Access control
    workspaceRole: workspaceRoleEnum('workspace_role').notNull().default('member'),

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
    index('workspace_members_user_id_idx').on(table.userId),
    index('workspace_members_workspace_id_idx').on(table.workspaceId),
    uniqueIndex('workspace_members_user_workspace_idx').on(table.userId, table.workspaceId),
  ]
);

export const workspaceMembersRelations = relations(workspaceMembers, ({ one, many }) => ({
  user: one(user, {
    fields: [workspaceMembers.userId],
    references: [user.id],
  }),
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  createdRecordingLinks: many(recordingLinks),
  createdRecordings: many(recordings),
}));
