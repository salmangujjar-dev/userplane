import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import createRouter from '@/api/lib/create-router';
import { registerRoutes } from '@/api/routes';
import { env, logConfig } from '@/api/env';
import { auth } from '@/api/clients/auth';
import { createAppLogger } from '@workspace/logger';

const app = new Hono();
const logger = createAppLogger('api');

// Log configuration on startup
logConfig();

// Middleware
app.use('*', honoLogger());
app.use(
  '*',
  cors({
    origin: env.cors.origins,
    credentials: env.cors.credentials,
    maxAge: env.cors.maxAge,
  })
);
app.use('*', prettyJSON());

// Better Auth routes - must come before API routes
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw);
});

// API v1 routes - all routes are defined in routes/index.ts
const apiRoutes = registerRoutes(createRouter());

// Mount API routes
app.route('/api/v1', apiRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      path: c.req.path,
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  logger.error({ err, path: c.req.path }, 'Internal server error');
  return c.json(
    {
      error: 'Internal Server Error',
      message: err.message,
    },
    500
  );
});

export default {
  port: env.port,
  hostname: env.host,
  fetch: app.fetch,
};
