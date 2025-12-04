import createRouter from '@/api/lib/create-router';
import { BASE_PATH } from '@/api/constants/api';
import type { AppOpenAPI } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';

// Public routes (no auth required)
import status from './status/status.index';

// Protected routes (auth required)
import user from './user/user.index';
import account from './account/account.index';

// Workspace routes
import workspaceCreation from './provisioner/provisioner.index';
import invite from './invite/invite.index';
import workspace from './workspace/workspace.index';

export function registerRoutes(app: AppOpenAPI) {
  return (
    app
      // Public routes
      .route('/', status)
      // Protected routes - apply auth middleware
      .use('/user/*', requireAuth)
      .route('/', user)
      .route('/account', account)
      // Workspace routes
      .route('/', workspaceCreation)
      .route('/', invite)
      .route('/', workspace)
  );
}

// Standalone router type used for api client
export const router = registerRoutes(createRouter().basePath(BASE_PATH));
export type router = typeof router;
