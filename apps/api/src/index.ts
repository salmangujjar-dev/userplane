import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { serveStatic } from 'hono/bun';
import { env, logConfig } from '@/api/env';
import { auth } from '@/api/clients/auth';
import { createAppLogger } from '@workspace/logger';
import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { onError } from '@orpc/server';
import { apiRouter } from '@/api/routes/api.router';

const app = new Hono();
const logger = createAppLogger('api');

const openAPIHandler = new OpenAPIHandler(apiRouter, {
  interceptors: [
    onError((error) => {
      logger.error({ err: error }, 'oRPC error');
    }),
  ],
});

// Log configuration on startup
logConfig();

// Serve favicon
app.get('/favicon.ico', serveStatic({ path: './public/favicon.svg' }));
app.get('/favicon.svg', serveStatic({ path: './public/favicon.svg' }));

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
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

// OpenAPI handler - handles RESTful requests
// Respects HTTP methods and paths defined in the contract
app.use('/api/v1/*', async (c, next) => {
  const { matched, response } = await openAPIHandler.handle(c.req.raw, {
    prefix: '/api/v1',
    context: {
      headers: c.req.raw.headers,
    },
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  await next();
});

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
