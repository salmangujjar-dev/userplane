import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import createRouter from './lib/create-router';
import { registerRoutes } from './routes';
import { env, logConfig } from './lib/env';
import { auth } from './lib/auth';

const app = new Hono();

// Log configuration on startup
logConfig();

// Middleware
app.use('*', logger());
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
  console.error(`Error: ${err.message}`);
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
