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
import { WORKSPACE_INVITE_POLICY_VALUES } from '../constants';
import { workspaceMembers } from './workspace-members';
import { entitlements } from './entitlements';
import { domains } from './domains';
import { projects } from './projects';
import { links } from './links';

/**
 * Workspace plan enum
 * Values derived from @workspace/pricing PLAN_IDS
 */
export const workspacePlanEnum = pgEnum('workspace_plan', PLAN_IDS);

/**
 * Workspace invite policy enum
 * - private: Not discoverable, only explicit invites work
 * - whitelisted: Discoverable, matching domains can join directly
 * - protected: Discoverable, matching domains can request access
 */
export const workspaceInvitePolicyEnum = pgEnum(
  'workspace_invite_policy',
  WORKSPACE_INVITE_POLICY_VALUES
);

export const workspaces = pgTable(
  'workspaces',
  {
    // Primary identifier
    workspaceId: text('workspace_id').primaryKey(),

    // Workspace identity and branding
    workspaceName: text('workspace_name').notNull(),

    // Subscription and plan
    workspacePlan: workspacePlanEnum('workspace_plan').notNull().default('early_bird_monthly'),

    // Settings and configuration
    // UUID token used for invite verification, must always be set
    workspaceInviteToken: text('workspace_invite_token').notNull(),

    // Workspace invite policy settings
    // Controls how users can discover and join the workspace
    workspaceInvitePolicy: workspaceInvitePolicyEnum('workspace_invite_policy')
      .notNull()
      .default('private'),
    // Email domains allowed to join/request access (only used for whitelisted/protected policies)
    // Stored as comma-separated values e.g. "example.com,company.org"
    workspaceInviteDomains: text('workspace_invite_domains'),

    // Billing info
    workspaceBillingEmail: text('workspace_billing_email'),

    // Recording link defaults
    recordingSlug: text('recording_slug').notNull(),
    recordingCustomizeLink: boolean('recording_customize_link').default(false).notNull(),
    recordingCompanyName: text('recording_company_name'),
    recordingCompanyLogoPath: text('recording_company_logo_path'),
    recordingHeader: text('recording_header'),
    recordingFootnote: text('recording_footnote'),
    recordingPrimaryColor: text('recording_primary_color'),
    recordingMaxDurationMs: integer('recording_max_duration'),

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
  links: many(links),
}));
