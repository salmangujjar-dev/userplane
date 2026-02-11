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
    // For accepting feature highlights
    // Members, Admins and Owners can opt in and opt out of this notification
    notifyFeatureHighlights: boolean('notify_feature_highlights').default(true).notNull(),
    // For accepting usage related emails
    // This includes alert emails and upsell nudges
    // Admins and members can opt out of this notification
    // Owners cannot opt out of this notification
    notifyUsageEvents: boolean('notify_usage_events').default(true).notNull(),
    // For accepting emails for incoming recordings and screenshots
    // This includes notifications for new recordings and screenshots
    // This is disabled by default to avoid spamming users
    // Members, Admins and Owners can opt in and opt out of this notification
    notifyIncomingEvents: boolean('notify_incoming_events').default(false).notNull(),
    // For accepting admin emails related to workspace
    // This includes notifications for new members, access requests, and role changes
    // Admins are not notified by default to avoid spamming them
    // Owners cannot opt out of this notification
    // Members cannot opt in to this notification
    notifyAdminEvents: boolean('notify_admin_events').default(false).notNull(),

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
