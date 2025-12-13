/**
 * Session routes - HTTP routes for session/upload operations
 * Public routes (no auth required - uses token-based authentication)
 */

import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import {
  getSessionHandler,
  initUploadHandler,
  completeUploadHandler,
} from '@/api/handlers/session.handlers';
import type { SessionService } from '@/api/services/session.service';

export function createSessionRoutes(sessionService: SessionService) {
  const sessionRoutes = new Hono<AppEnv>();

  // GET /session - Initialize recording session
  // Query params: token (JWT token from link URL)
  // Returns: session_token, expires_in
  sessionRoutes.get('/', getSessionHandler(sessionService));

  // POST /session - Initialize upload and get presigned URLs
  // Headers: X-Session-Token: <session_token>
  // Body: { recording_duration, files: [{type, name, size, mime_type}] }
  // Returns: recording_id, upload_token, presigned_urls
  sessionRoutes.post('/', initUploadHandler(sessionService));

  // PATCH /session - Complete or fail upload
  // Headers: X-Upload-Token: <upload_token>
  // Body: { recording_id, state: 'complete' | 'failed', reason? }
  // Returns: success, recording_id, status
  sessionRoutes.patch('/', completeUploadHandler(sessionService));

  return sessionRoutes;
}
