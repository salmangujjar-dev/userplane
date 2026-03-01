import type { UploadStatus } from '@userplane/contract';
import { RECORDING_DURATION_LIMITS } from '@userplane/contract';
import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import type { StreamingStatus, StreamProvider } from '../constants';
import {
  STREAM_PROVIDER_VALUES,
  STREAMING_STATUS_VALUES,
  UPLOAD_STATUS_VALUES,
} from '../constants';
import { links } from './links';
import { projects } from './projects';
import { workspaceMembers } from './workspace-members';
import { workspaces } from './workspaces';

export const recordings = pgTable(
  'recordings',
  {
    // Primary identifier
    recordingId: text('recording_id').primaryKey(),

    // Relationships (workspaceId denormalized for fast queries)
    recordingLinkId: text('recording_link_id')
      .notNull()
      .references(() => links.linkId, { onDelete: 'restrict' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspaces.workspaceId, { onDelete: 'restrict' }),
    projectId: text('project_id')
      .notNull()
      .references(() => projects.projectId, { onDelete: 'restrict' }),
    createdBy: text('created_by')
      .notNull()
      .references(() => workspaceMembers.workspaceMemberId, { onDelete: 'restrict' }),

    // Upload status
    uploadStatus: text('upload_status').$type<UploadStatus>().notNull().default('pending'),

    // Hot storage (14-day retention in stream provider)
    streamProvider: text('stream_provider').$type<StreamProvider>(),
    streamId: text('stream_id'),
    streamingStatus: text('streaming_status').$type<StreamingStatus>(),

    // Cold storage (permanent archival in object storage)
    recordingVideoRef: text('recording_video_ref'),
    recordingThumbnailRef: text('recording_thumbnail_ref'),
    recordingConsoleLogRef: text('recording_console_log_ref'),
    recordingNetworkLogsRef: text('recording_network_logs_ref'),
    recordingActionRef: text('recording_action_ref'),

    // Recording metadata - split into system and custom
    systemMeta: jsonb('system_meta'),
    customMeta: jsonb('custom_meta'),
    notes: text('notes'),

    // Recording metrics
    recordingDurationMs: integer('recording_duration')
      .notNull()
      .default(RECORDING_DURATION_LIMITS.DEFAULT_MAX_DURATION_MS),
    recordingStartedAt: timestamp('recording_started_at', { withTimezone: true }),

    // Retention
    expiresAt: timestamp('expires_at', { withTimezone: true }),

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
    index('recordings_recording_link_id_idx').on(table.recordingLinkId),
    index('recordings_upload_status_idx').on(table.uploadStatus),
    index('recordings_workspace_id_idx').on(table.workspaceId),
    index('recordings_created_by_idx').on(table.createdBy),
    index('recordings_project_id_idx').on(table.projectId),
    index('recordings_workspace_created_at_idx').on(table.workspaceId, table.createdAt),
    index('recordings_stream_id_idx').on(table.streamId),
    index('recordings_expires_at_idx').on(table.expiresAt),
    // Partial indexes for soft-delete filtering
    index('recordings_active_workspace_created_idx')
      .on(table.workspaceId, table.createdAt)
      .where(sql`${table.isDeleted} = false`),
    index('recordings_active_expires_idx')
      .on(table.expiresAt)
      .where(sql`${table.isDeleted} = false AND ${table.uploadStatus} = 'available'`),
    // Composite indexes for hot query paths
    index('recordings_workspace_status_created_idx').on(
      table.workspaceId,
      table.uploadStatus,
      table.createdAt
    ),
    index('recordings_project_deleted_idx').on(table.projectId, table.isDeleted),
    check(
      'recordings_upload_status_check',
      sql`${table.uploadStatus} IN (${sql.raw(UPLOAD_STATUS_VALUES.map((v) => `'${v}'`).join(', '))})`
    ),
    check(
      'recordings_stream_provider_check',
      sql`${table.streamProvider} IS NULL OR ${table.streamProvider} IN (${sql.raw(STREAM_PROVIDER_VALUES.map((v) => `'${v}'`).join(', '))})`
    ),
    check(
      'recordings_streaming_status_check',
      sql`${table.streamingStatus} IS NULL OR ${table.streamingStatus} IN (${sql.raw(STREAMING_STATUS_VALUES.map((v) => `'${v}'`).join(', '))})`
    ),
  ]
);

export const recordingsRelations = relations(recordings, ({ one }) => ({
  link: one(links, {
    fields: [recordings.recordingLinkId],
    references: [links.linkId],
  }),
  workspace: one(workspaces, {
    fields: [recordings.workspaceId],
    references: [workspaces.workspaceId],
  }),
  project: one(projects, {
    fields: [recordings.projectId],
    references: [projects.projectId],
  }),
  creator: one(workspaceMembers, {
    fields: [recordings.createdBy],
    references: [workspaceMembers.workspaceMemberId],
  }),
}));
