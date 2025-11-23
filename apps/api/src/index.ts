import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import users from './routes/users';
import authTest from './routes/auth-test';
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

// Routes
app.get('/', (c) => {
  return c.json(
    {
      message: 'Welcome to Hono API',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api/v1',
      },
    },
    200
  );
});

app.get('/health', (c) => {
  return c.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    200
  );
});

// Better Auth routes
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  return auth.handler(c.req.raw);
});

// API v1 routes - chain handlers for proper type inference
const apiRoutes = new Hono().route('/users', users).route('/auth-test', authTest);

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

// Export app type for RPC
export type AppType = typeof apiRoutes;

export default {
  port: env.port,
  hostname: env.host,
  fetch: app.fetch,
};
