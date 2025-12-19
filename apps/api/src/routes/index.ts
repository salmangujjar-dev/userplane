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
import link from './link/link.index';
import recording from './recording/recording.index';

// Public routes (token-based auth)
import session from './session/session.index';
import domain from './domain/domain.index';

export function registerRoutes(app: AppOpenAPI) {
  return (
    app
      // Public routes
      .route('/', status)
      .route('/', session)
      .route('/', domain)
      // Protected routes
      .route('/account', account)
      // Workspace routes
      .route('/', workspaceCreation)
      .route('/', invite)
      .route('/', workspace)
      .route('/', link)
      .route('/', recording)
  );
}

// Standalone router type used for api client
export const router = registerRoutes(createRouter().basePath(BASE_PATH));
export type router = typeof router;
