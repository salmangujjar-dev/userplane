/**
 * Recording links route initialization and dependency injection
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { db } from '@/api/clients/db';

import { RecordingLinkRepository } from '@/api/repositories/recording-links.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { RecordingLinkService } from '@/api/services/recording-link.service';

import { workspaceMemberService, workspaceService } from '../workspace/workspace.index';
import { createRecordingLinksRoutes } from './recording-links.routes';

// Initialize repositories and service
const recordingLinkRepo = new RecordingLinkRepository(db);
const workspaceMemberRepo = new WorkspaceMemberRepository(db);
const projectRepo = new ProjectRepository(db);

export const recordingLinkService = new RecordingLinkService({
  recordingLinkRepo,
  workspaceMemberRepo,
  projectRepo,
});

// Create routes with injected dependencies
const recordingLinksRoutes = createRecordingLinksRoutes(
  recordingLinkService,
  workspaceMemberService,
  workspaceService
);

// Mount routes under workspace path
const app = new Hono<AppEnv>();
app.route('/workspace/:workspaceId/recording-links', recordingLinksRoutes);

export default app;
