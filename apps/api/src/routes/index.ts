import createRouter from '@/api/lib/create-router';
import { BASE_PATH } from '@/api/constants/api';
import type { AppOpenAPI } from '@/api/lib/types';
import { requireAuth } from '@/api/middleware/auth';

// Public routes (no auth required)
import status from './status/status.index';

// Protected routes (auth required)
import users from './users/users.index';

// Workspace provisioning routes
import provisioner from './provisioner/provisioner.index';
import invites from './invites/invites.index';
import workspaces from './workspaces/workspaces.index';

export function registerRoutes(app: AppOpenAPI) {
  return (
    app
      // Public routes
      .route('/', status)
      // Protected routes - apply auth middleware
      .use('/users/*', requireAuth)
      .route('/', users)
      // Workspace routes
      .route('/', provisioner)
      .route('/', invites)
      .route('/', workspaces)
  );
}

// Standalone router type used for api client
export const router = registerRoutes(createRouter().basePath(BASE_PATH));
export type router = typeof router;
