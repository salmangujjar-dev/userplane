/**
 * Recordings route initialization and dependency injection
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { recordingService, workspaceMemberService, workspaceService } from '@/api/services';
import { createRecordingsRoutes } from './recordings.routes';

const recordingsRoutes = createRecordingsRoutes(
  recordingService,
  workspaceMemberService,
  workspaceService
);

const app = new Hono<AppEnv>();
app.route('/workspace/:workspaceId/recordings', recordingsRoutes);

export default app;
