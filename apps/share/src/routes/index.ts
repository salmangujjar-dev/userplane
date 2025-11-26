import createRouter from '@/share/lib/create-router';
import { BASE_PATH } from '@/share/constants/api';
import type { AppOpenAPI } from '@/share/lib/types';

import status from './status/status.index';

export function registerRoutes(app: AppOpenAPI) {
  return app.route('/', status);
}

export const router = registerRoutes(createRouter().basePath(BASE_PATH));
export type router = typeof router;
