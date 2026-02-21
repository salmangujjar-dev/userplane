import type { WorkspaceInvitePolicy } from '@workspace/contract';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

import { WORKSPACE_INVITE_POLICY_VALUES } from '../constants';
import { domains } from './domains';
import { entitlements } from './entitlements';
import { links } from './links';
import { projects } from './projects';
import { workspaceMembers } from './workspace-members';

export const workspaces = pgTable(
  'workspaces',
  {
    // Primary identifier
    workspaceId: text('workspace_id').primaryKey(),

    // Workspace identity and branding
    workspaceName: text('workspace_name').notNull(),

    // Settings and configuration
    // UUID token used for invite verification, must always be set
    workspaceInviteToken: text('workspace_invite_token').notNull(),

    // Workspace invite policy settings
    // Controls how users can discover and join the workspace
    /**
     * Workspace invite policy
     * - private: Not discoverable, only explicit invites work
     * - whitelisted: Discoverable, matching domains can join directly
     * - protected: Discoverable, matching domains can request access
     */
    workspaceInvitePolicy: text('workspace_invite_policy')
      .$type<WorkspaceInvitePolicy>()
      .notNull()
      .default('private'),
    // Email domains allowed to join/request access (only used for whitelisted/protected policies)
    // Stored as comma-separated values e.g. "example.com,company.org"
    workspaceInviteDomains: text('workspace_invite_domains'),

    // Billing info
    // DodoPayments customer ID (set when first checkout is completed)
    dodoCustomerId: text('dodo_customer_id'),

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
    uniqueIndex('workspaces_recording_slug_idx').on(table.recordingSlug),
    check(
      'workspaces_invite_policy_check',
      sql`${table.workspaceInvitePolicy} IN (${sql.raw(WORKSPACE_INVITE_POLICY_VALUES.map((v) => `'${v}'`).join(', '))})`
    ),
  ]
);

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  members: many(workspaceMembers),
  entitlements: many(entitlements),
  domains: many(domains),
  projects: many(projects),
  links: many(links),
}));
