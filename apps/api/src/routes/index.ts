import createRouter from '../lib/create-router';
import { BASE_PATH } from '../lib/constants';
import type { AppOpenAPI } from '../lib/types';
import { requireAuth } from '../middleware/auth';

// Public routes (no auth required)
import status from './status/status.index';

// Protected routes (auth required)
import users from './users/users.index';
import todos from './todos/todos.index';

export function registerRoutes(app: AppOpenAPI) {
  return (
    app
      // Public routes
      .route('/', status)
      // Protected routes - apply auth middleware
      .use('/users/*', requireAuth)
      .route('/', users)
      .use('/todos/*', requireAuth)
      .route('/', todos)
  );
}

// Standalone router type used for api client
export const router = registerRoutes(createRouter().basePath(BASE_PATH));
export type router = typeof router;
