import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
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
    workspaceName: text('workspace_name').notNull(),

    // Subscription and plan
    workspacePlan: workspacePlanEnum('workspace_plan').notNull().default('starter_monthly'),

    // Settings and configuration
    // UUID token used for invite verification, must always be set
    workspaceInviteToken: text('workspace_invite_token').notNull(),

    // Recording link defaults
    recordingSlug: text('recording_slug').notNull(),
    recordingCustomizeLink: boolean('recording_customize_link').default(false).notNull(),
    recordingHideSensitive: boolean('recording_hide_sensitive').default(false).notNull(),
    recordingCaptureClientLog: boolean('recording_capture_client_log').default(true).notNull(),
    recordingCaptureServerLog: boolean('recording_capture_server_log').default(true).notNull(),
    recordingCompanyName: text('recording_company_name'),
    recordingCompanyLogoPath: text('recording_company_logo_path'),
    recordingHeader: text('recording_header'),
    recordingFootnote: text('recording_footnote'),
    recordingPrimaryColor: text('recording_primary_color'),
    recordingMaxDuration: integer('recording_max_duration'),

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
  (table) => [uniqueIndex('workspaces_recording_slug_idx').on(table.recordingSlug)]
);

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  entitlements: many(entitlements),
  domains: many(domains),
  projects: many(projects),
  recordingLinks: many(recordingLinks),
}));
