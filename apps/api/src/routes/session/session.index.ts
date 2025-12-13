/**
 * Session routes index
 * Sets up session routes with dependencies
 */

import createRouter from '@/api/lib/create-router';
import { createSessionRoutes } from './session.routes';
import { SessionService } from '@/api/services/session.service';
import { LinkService } from '@/api/services/link.service';
import { LinkRepository } from '@/api/repositories/links.repository';
import { RecordingRepository } from '@/api/repositories/recordings.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { db } from '@/api/clients/db';
import {
  getVideoStorage,
  getThumbnailsStorage,
  getConsoleLogsStorage,
  getNetworkLogsStorage,
} from '@/api/clients/storage';

// Initialize repositories
const linkRepo = new LinkRepository(db);
const recordingRepo = new RecordingRepository(db);
const workspaceMemberRepo = new WorkspaceMemberRepository(db);
const projectRepo = new ProjectRepository(db);

// Initialize storage clients
const videoStorage = getVideoStorage();
const thumbnailsStorage = getThumbnailsStorage();
const consoleLogsStorage = getConsoleLogsStorage();
const networkLogsStorage = getNetworkLogsStorage();

// Initialize domain repository for link service
const domainRepo = new DomainRepository(db);

// Initialize link service for token validation
const linkService = new LinkService({
  linkRepo,
  workspaceMemberRepo,
  projectRepo,
  domainRepo,
});

// Initialize service with dependencies
const sessionService = new SessionService({
  linkRepo,
  recordingRepo,
  videoStorage,
  thumbnailsStorage,
  consoleLogsStorage,
  networkLogsStorage,
  linkService,
});

// Create and mount routes
const app = createRouter();
const sessionRoutes = createSessionRoutes(sessionService);
app.route('/session', sessionRoutes);

export default app;
