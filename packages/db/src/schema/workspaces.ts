import { pgTable, text, timestamp, boolean, uniqueIndex, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { workspaceMembers } from './workspace-members';
import { entitlements } from './entitlements';
import { domains } from './domains';
import { projects } from './projects';
import { recordingLinks } from './recording-links';

export const workspacePlanEnum = pgEnum('workspace_plan', [
  'trial',
  'starter',
  'scale_up',
  'enterprise',
  'reverse_trial',
]);

export const workspaces = pgTable(
  'workspaces',
  {
    // Primary identifier
    id: text('id').primaryKey(),

    // Workspace identity and branding
    workspaceSlug: text('workspace_slug').notNull(),
    workspaceName: text('workspace_name').notNull(),
    logoUrl: text('logo_url'),

    // Subscription and plan
    workspacePlan: workspacePlanEnum('workspace_plan').notNull().default('trial'),

    // Settings and configuration
    workspaceInviteToken: text('workspace_invite_token'),
    defaultProjectId: text('default_project_id'),

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

export const workspacesRelations = relations(workspaces, ({ many, one }) => ({
  members: many(workspaceMembers),
  entitlements: many(entitlements),
  domains: many(domains),
  projects: many(projects),
  recordingLinks: many(recordingLinks),
  defaultProject: one(projects, {
    fields: [workspaces.defaultProjectId],
    references: [projects.id],
  }),
}));
