/**
 * Recordings route initialization and dependency injection
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { db } from '@/api/clients/db';
import {
  getThumbnailsStorage,
  getVideoStorage,
  getConsoleLogsStorage,
  getNetworkLogsStorage,
} from '@/api/clients/storage';

import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { RecordingService } from '@/api/services/recording.service';
import { CleanupService } from '@/api/services/cleanup.service';

import { workspaceMemberService, workspaceService } from '../workspace/workspace.index';
import { createRecordingsRoutes } from './recordings.routes';

// Initialize repository and service
const recordingRepo = new RecordingRepository(db);

// Initialize cleanup service for storage cleanup and purged state management
const cleanupService = new CleanupService({
  recordingRepo,
  videoStorage: getVideoStorage(),
  thumbnailsStorage: getThumbnailsStorage(),
  consoleLogsStorage: getConsoleLogsStorage(),
  networkLogsStorage: getNetworkLogsStorage(),
});

export const recordingService = new RecordingService({
  recordingRepo,
  thumbnailsStorage: getThumbnailsStorage(),
  videoStorage: getVideoStorage(),
  consoleLogsStorage: getConsoleLogsStorage(),
  networkLogsStorage: getNetworkLogsStorage(),
  cleanupService,
});

// Create routes with injected dependencies
const recordingsRoutes = createRecordingsRoutes(
  recordingService,
  workspaceMemberService,
  workspaceService
);

// Mount routes under workspace path
const app = new Hono<AppEnv>();
app.route('/workspace/:workspaceId/recordings', recordingsRoutes);

export default app;
