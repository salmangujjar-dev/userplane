import {
  pgTable,
  text,
  timestamp,
  boolean,
  jsonb,
  integer,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { links } from './links';
import { workspaces } from './workspaces';
import { projects } from './projects';
import { workspaceMembers } from './workspace-members';
import {
  UPLOAD_STATUS_VALUES,
  STREAM_PROVIDER_VALUES,
  STREAMING_STATUS_VALUES,
} from '../constants';
import { RECORDING_DURATION_LIMITS } from '@workspace/contract';

export const uploadStatusEnum = pgEnum('upload_status', UPLOAD_STATUS_VALUES);
export const streamProviderEnum = pgEnum('stream_provider', STREAM_PROVIDER_VALUES);
export const streamingStatusEnum = pgEnum('streaming_status', STREAMING_STATUS_VALUES);

export const recordings = pgTable(
  'recordings',
  {
    // Primary identifier
    recordingId: text('recording_id').primaryKey(),

    // Relationships (workspaceId denormalized for fast queries)
    recordingLinkId: text('recording_link_id').notNull(),
    workspaceId: text('workspace_id').notNull(),
    projectId: text('project_id').notNull(),
    createdBy: text('created_by').notNull(),

    // Upload status
    uploadStatus: uploadStatusEnum('upload_status').notNull().default('pending'),

    // Hot storage (14-day retention in stream provider)
    streamProvider: streamProviderEnum('stream_provider'),
    streamId: text('stream_id'),
    streamingStatus: streamingStatusEnum('streaming_status'),

    // Cold storage (permanent archival in object storage)
    recordingVideoRef: text('recording_video_ref'),
    recordingThumbnailRef: text('recording_thumbnail_ref'),
    recordingConsoleLogRef: text('recording_console_log_ref'),
    recordingNetworkLogsRef: text('recording_network_logs_ref'),

    // Recording metadata
    recordingMeta: jsonb('recording_meta'),

    // Recording metrics
    recordingDurationMs: integer('recording_duration').default(
      RECORDING_DURATION_LIMITS.DEFAULT_MAX_DURATION_MS
    ),

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
    index('recordings_recording_link_id_idx').on(table.recordingLinkId),
    index('recordings_upload_status_idx').on(table.uploadStatus),
    index('recordings_workspace_id_idx').on(table.workspaceId),
    index('recordings_created_by_idx').on(table.createdBy),
    index('recordings_project_id_idx').on(table.projectId),
    index('recordings_workspace_created_at_idx').on(table.workspaceId, table.createdAt),
    index('recordings_stream_id_idx').on(table.streamId),
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
