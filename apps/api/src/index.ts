// Initialize Sentry first, before all other imports
import { initSentry } from '@/api/sentry';
initSentry();

import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { isDefinedError, onError } from '@orpc/server';
import * as Sentry from '@sentry/bun';
import { createRateLimitMiddleware, getClientIP, rateLimitMiddlewares } from '@workspace/cache';
import { createAppLogger } from '@workspace/logger';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import { auth } from '@/api/clients/auth';
import { rateLimiter } from '@/api/clients/redis';
import { env, logConfig } from '@/api/env';
import { runWithWebhookContext } from '@/api/lib/webhook-context';
import { apiRouter } from '@/api/routes/api.router';

const app = new Hono();
const logger = createAppLogger('api');

const openAPIHandler = new OpenAPIHandler(apiRouter, {
  interceptors: [
    onError((error) => {
      if (!isDefinedError(error)) {
        Sentry.captureException(error);
      }
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

// Public endpoints that allow any origin (called from customer websites)
// These need permissive CORS since the origin is the customer's domain being verified
app.use(
  '/api/v1/domains/verify',
  cors({
    origin: '*',
    credentials: false,
    maxAge: env.cors.maxAge,
  })
);

// Default CORS for authenticated endpoints
app.use(
  '*',
  cors({
    origin: env.cors.origins,
    credentials: env.cors.credentials,
    maxAge: env.cors.maxAge,
  })
);

app.use('*', prettyJSON());

// Rate limiting middleware - after CORS, before routes
// Public endpoints rate limiting (IP-based)
if (rateLimiter.isAvailable()) {
  // Status endpoints (/, /health)
  app.use('/api/v1/', rateLimitMiddlewares.public(rateLimiter));
  app.use('/api/v1/health', rateLimitMiddlewares.public(rateLimiter));

  // Invite validation (public)
  app.use('/api/v1/invite/*', rateLimitMiddlewares.public(rateLimiter));

  // Domain verification (public)
  app.use('/api/v1/domains/*', rateLimitMiddlewares.public(rateLimiter));

  // Session initialization (stricter limit for recording init)
  app.use('/api/v1/session', rateLimitMiddlewares.session(rateLimiter));
  app.use('/api/v1/session/*', rateLimitMiddlewares.session(rateLimiter));

  // Webhook endpoints (high limit to ensure processing)
  app.use(
    '/api/auth/dodopayments/webhooks/*',
    createRateLimitMiddleware(rateLimiter, {
      tier: 'webhook',
      getIdentifier: getClientIP,
    })
  );

  logger.info('Rate limiting middleware enabled');
}

// Better Auth routes - must come before API routes
// For webhook routes, intercept headers and store in AsyncLocalStorage
// so they can be accessed in the onPayload callback
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  const path = c.req.path;

  // Check if this is the DodoPayments webhook endpoint
  if (path.includes('/dodopayments/webhooks')) {
    const webhookId = c.req.header('webhook-id');
    const webhookTimestamp = c.req.header('webhook-timestamp');

    if (webhookId && webhookTimestamp) {
      // Run the auth handler within webhook context so onPayload can access headers
      return runWithWebhookContext({ webhookId, webhookTimestamp }, () => auth.handler(c.req.raw));
    }
  }

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

// OpenAPI specification and documentation (development only)
if (env.nodeEnv === 'development') {
  const { OpenAPIGenerator } = await import('@orpc/openapi');
  const { ZodToJsonSchemaConverter } = await import('@orpc/zod');

  const openAPIGenerator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  });

  // OpenAPI specification endpoint
  app.get('/spec.json', async (c) => {
    const spec = await openAPIGenerator.generate(apiRouter, {
      info: {
        title: 'Userplane API',
        version: '1.0.0',
        description: 'API for managing workspaces, recordings, links, and domains',
      },
      servers: [
        {
          url: `${env.auth.url}/api/v1`,
          description: 'API Server',
        },
      ],
      security: [{ cookieAuth: [] }],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'userplane.session_token',
            description: 'Session token cookie from authentication (used by most endpoints)',
          },
          sessionTokenHeader: {
            type: 'apiKey',
            in: 'header',
            name: 'x-userplane-session-token',
            description: 'Session token header for upload initialization',
          },
          uploadTokenHeader: {
            type: 'apiKey',
            in: 'header',
            name: 'x-userplane-upload-token',
            description: 'Upload token header for completing uploads',
          },
        },
      },
      tags: [
        {
          name: 'Status',
          description: 'API health checks and service information',
        },
        {
          name: 'Session',
          description: 'Recording session initialization and upload management for the recorder',
        },
        {
          name: 'Account',
          description: 'User account management and profile operations',
        },
        {
          name: 'Provisioner',
          description: 'Workspace provisioning and initial setup',
        },
        {
          name: 'Workspaces',
          description: 'Workspace CRUD operations, settings, members, domains, and invites',
        },
        {
          name: 'Projects',
          description: 'Project management within workspaces for organizing recordings',
        },
        {
          name: 'Recordings',
          description: 'Recording management, playback, and resource access',
        },
        {
          name: 'Links',
          description: 'Recording link creation and management for sharing recordings',
        },
        {
          name: 'Domains',
          description: 'Public domain verification for recording capture',
        },
        {
          name: 'Invites',
          description: 'Public workspace invitation validation and acceptance',
        },
      ],
    });

    return c.json(spec);
  });

  // API documentation UI using Scalar
  app.get('/docs', (c) => {
    const html = `
    <!doctype html>
    <html>
      <head>
        <title>Userplane API Documentation</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <div id="app"></div>
        <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        <script>
          Scalar.createApiReference('#app', {
            url: '/spec.json',
            theme: 'default',
          })
        </script>
      </body>
    </html>
  `;

    return c.html(html);
  });

  logger.info('API documentation available at /docs and /spec.json');
}

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

  // Capture application level error in Sentry with request context
  if (!isDefinedError(err)) {
    Sentry.captureException(err, {
      contexts: {
        request: {
          path: c.req.path,
          method: c.req.method,
        },
      },
    });
  }

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
