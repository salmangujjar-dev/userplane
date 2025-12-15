/**
 * Recordings route initialization and dependency injection
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { db } from '@/api/clients/db';

import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { LinkRepository } from '@/api/repositories/links.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { RecordingService } from '@/api/services/recording.service';
import {
  getThumbnailsStorage,
  getVideoStorage,
  getConsoleLogsStorage,
  getNetworkLogsStorage,
} from '@/api/clients/storage';

import { workspaceMemberService, workspaceService } from '../workspace/workspace.index';
import { createRecordingsRoutes } from './recordings.routes';

// Initialize repositories
const recordingRepo = new RecordingRepository(db);
const linkRepo = new LinkRepository(db);
const workspaceMemberRepo = new WorkspaceMemberRepository(db);

export const recordingService = new RecordingService({
  recordingRepo,
  linkRepo,
  workspaceMemberRepo,
  thumbnailsStorage: getThumbnailsStorage(),
  videoStorage: getVideoStorage(),
  consoleLogsStorage: getConsoleLogsStorage(),
  networkLogsStorage: getNetworkLogsStorage(),
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
