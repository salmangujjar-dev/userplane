/**
 * Links route initialization and dependency injection
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { db } from '@/api/clients/db';

import { LinkRepository } from '@/api/repositories/links.repository';
import { WorkspaceMemberRepository } from '@/api/repositories/workspace-members.repository';
import { ProjectRepository } from '@/api/repositories/projects.repository';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import { LinkService } from '@/api/services/link.service';

import { workspaceMemberService, workspaceService } from '../workspace/workspace.index';
import { createLinksRoutes } from './links.routes';

// Initialize repositories and service
const linkRepo = new LinkRepository(db);
const workspaceMemberRepo = new WorkspaceMemberRepository(db);
const projectRepo = new ProjectRepository(db);
const domainRepo = new DomainRepository(db);
const workspaceRepo = new WorkspaceRepository(db);

export const linkService = new LinkService({
  linkRepo,
  workspaceMemberRepo,
  projectRepo,
  domainRepo,
  workspaceRepo,
});

// Create routes with injected dependencies
const linksRoutes = createLinksRoutes(linkService, workspaceMemberService, workspaceService);

// Mount routes under workspace path
const app = new Hono<AppEnv>();
app.route('/workspace/:workspaceId/links', linksRoutes);

export default app;
