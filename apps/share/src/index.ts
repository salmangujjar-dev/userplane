/**
 * Share API
 * Entry point for the share service
 */

import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { router } from '@/share/routes';
import { env, logConfig } from '@/share/env';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.route('/', router);

// Start server with configured port
logConfig();

export default {
  port: env.port,
  fetch: app.fetch,
};
