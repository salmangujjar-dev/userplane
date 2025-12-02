import { pgTable, text, timestamp, boolean, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { PLAN_IDS } from '@workspace/pricing';
import { workspaceMembers } from './workspace-members';
import { entitlements } from './entitlements';
import { domains } from './domains';
import { projects } from './projects';
import { recordingLinks } from './recording-links';

/**
 * Workspace plan enum
 * Values derived from @workspace/pricing PLAN_IDS
 */
export const workspacePlanEnum = pgEnum('workspace_plan', PLAN_IDS);

export const workspaces = pgTable(
  'workspaces',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Workspace identity and branding
    workspaceSlug: text('workspace_slug').notNull(),
    workspaceName: text('workspace_name').notNull(),
    workspaceLogoUrl: text('workspace_logo_url').notNull(),

    // Subscription and plan
    workspacePlan: workspacePlanEnum('workspace_plan').notNull().default('starter_monthly'),

    // Settings and configuration
    // UUID token used for invite verification, must always be set
    workspaceInviteToken: text('workspace_invite_token').notNull(),

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
  (table) => [uniqueIndex('workspaces_workspace_slug_idx').on(table.workspaceSlug)]
);

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  entitlements: many(entitlements),
  domains: many(domains),
  projects: many(projects),
  recordingLinks: many(recordingLinks),
}));
