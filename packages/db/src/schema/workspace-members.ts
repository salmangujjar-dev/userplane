import { relations } from 'drizzle-orm';
import { boolean, index, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

import { WORKSPACE_ROLE_VALUES } from '../constants';
import { links } from './links';
import { recordings } from './recordings';
import { user } from './user';
import { workspaces } from './workspaces';

export const workspaceRoleEnum = pgEnum('workspace_role', WORKSPACE_ROLE_VALUES);

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    // Primary identifier
    workspaceMemberId: text('workspace_member_id').primaryKey(),

    // Relationships
    userId: text('user_id').notNull(),
    workspaceId: text('workspace_id').notNull(),

    // Access control
    workspaceRole: workspaceRoleEnum('workspace_role').notNull().default('member'),

    // Notification preferences
    notifyOnLinkUsage: boolean('notify_on_link_usage').default(true).notNull(),
    notifyOnQuotaReset: boolean('notify_on_quota_reset').default(false).notNull(),
    notifyOnQuotaLimit: boolean('notify_on_quota_limit').default(false).notNull(),
    notifyOnInviteAccepted: boolean('notify_on_invite_accepted').default(true).notNull(),
    notifyOnMemberJoin: boolean('notify_on_member_join').default(false).notNull(),

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
    references: [workspaces.workspaceId],
  }),
  createdLinks: many(links),
  createdRecordings: many(recordings),
}));
