import createRouter from '@/api/lib/create-router';
import { BASE_PATH } from '@/api/constants/api';
import type { AppOpenAPI } from '@/api/lib/types';

// Public routes (no auth required)
import status from './status/status.index';

// Protected routes (auth required)
import account from './account/account.index';

// Workspace routes
import workspaceCreation from './provisioner/provisioner.index';
import invite from './invite/invite.index';
import workspace from './workspace/workspace.index';
import links from './links/links.index';
import recordings from './recordings/recordings.index';

export function registerRoutes(app: AppOpenAPI) {
  return (
    app
      // Public routes
      .route('/', status)
      // Protected routes
      .route('/account', account)
      // Workspace routes
      .route('/', workspaceCreation)
      .route('/', invite)
      .route('/', workspace)
      .route('/', links)
      .route('/', recordings)
  );
}

// Standalone router type used for api client
export const router = registerRoutes(createRouter().basePath(BASE_PATH));
export type router = typeof router;
