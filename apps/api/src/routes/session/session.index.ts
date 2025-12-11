/**
 * Session routes index
 * Sets up session routes with dependencies
 */

import createRouter from '@/api/lib/create-router';
import { createSessionRoutes } from './session.routes';
import { SessionService } from '@/api/services/session.service';
import { LinkRepository } from '@/api/repositories/links.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { db } from '@/api/clients/db';
import {
  getRecordingsStorage,
  getThumbnailsStorage,
  getConsoleLogsStorage,
  getNetworkLogsStorage,
} from '@/api/clients/storage';

// Initialize repositories
const linkRepo = new LinkRepository(db);
const recordingRepo = new RecordingRepository(db);

// Initialize storage clients
const recordingsStorage = getRecordingsStorage();
const thumbnailsStorage = getThumbnailsStorage();
const consoleLogsStorage = getConsoleLogsStorage();
const networkLogsStorage = getNetworkLogsStorage();

// Initialize service with dependencies
const sessionService = new SessionService({
  linkRepo,
  recordingRepo,
  recordingsStorage,
  thumbnailsStorage,
  consoleLogsStorage,
  networkLogsStorage,
});

// Create and mount routes
const app = createRouter();
const sessionRoutes = createSessionRoutes(sessionService);
app.route('/session', sessionRoutes);

export default app;
