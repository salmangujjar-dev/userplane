import type { WorkspaceRole } from '@userplane/contract';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { WORKSPACE_ROLE_VALUES } from '../constants';
import { links } from './links';
import { recordings } from './recordings';
import { user } from './user';
import { workspaces } from './workspaces';

export const workspaceMembers = pgTable(
  'workspace_members',
  {
    // Primary identifier
    workspaceMemberId: text('workspace_member_id').primaryKey(),

    // Relationships
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'restrict' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'restrict' }),

    // Access control
    workspaceRole: text('workspace_role').$type<WorkspaceRole>().notNull().default('member'),

    // Notification preferences
    // For accepting feature highlights
    // Members, Admins and Owners can opt in and opt out of this notification
    notifyFeatureHighlights: boolean('notify_feature_highlights').default(true).notNull(),
    // For accepting usage related emails
    // This includes alert emails and upsell nudges
    // Admins and members can opt out of this notification
    // Owners cannot opt out of this notification
    notifyUsageEvents: boolean('notify_usage_events').default(true).notNull(),
    // Per-channel notification preferences for incoming recordings and screenshots
    // JSONB: { email: boolean, slack?: boolean, intercom?: boolean, zendesk?: boolean }
    // Each channel is independently toggleable. Disabled by default to avoid spamming.
    notifyIncomingEvents: jsonb('notify_incoming_events')
      .default(sql`'{"email": false}'::jsonb`)
      .notNull(),
    // For accepting admin emails related to workspace
    // This includes notifications for new members, access requests, and role changes
    // Admins are not notified by default to avoid spamming them
    // Owners cannot opt out of this notification
    // Members cannot opt in to this notification
    notifyAdminEvents: boolean('notify_admin_events').default(false).notNull(),

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
    index('workspace_members_user_id_idx').on(table.userId),
    index('workspace_members_workspace_id_idx').on(table.workspaceId),
    uniqueIndex('workspace_members_user_workspace_idx').on(table.userId, table.workspaceId),
    // Partial indexes for soft-delete filtering
    index('workspace_members_active_workspace_role_idx')
      .on(table.workspaceId, table.workspaceRole)
      .where(sql`${table.isDeleted} = false`),
    index('workspace_members_active_user_idx')
      .on(table.userId)
      .where(sql`${table.isDeleted} = false`),
    check(
      'workspace_members_role_check',
      sql`${table.workspaceRole} IN (${sql.raw(WORKSPACE_ROLE_VALUES.map((v) => `'${v}'`).join(', '))})`
    ),
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
