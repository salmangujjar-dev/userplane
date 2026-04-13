// Initialize PostHog first, before all other imports
import { initPostHog, initPostHogFeatureFlags } from '@/api/posthog';
initPostHog();
initPostHogFeatureFlags();

import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { isDefinedError, onError } from '@orpc/server';
import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from '@userplane/auth';
import { createRateLimitMiddleware, getClientIP, rateLimitMiddlewares } from '@userplane/cache';
import type { Context } from 'hono';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';

import { auth } from '@/api/clients/auth';
import { rateLimiter } from '@/api/clients/redis';
import { cacheService } from '@/api/clients/redis';
import { env, logConfig } from '@/api/env';
import {
  createInboxInitializeHandler,
  createInboxSubmitHandler,
  createMessengerConfigureHandler,
  createMessengerInitializeHandler,
  createMessengerSubmitHandler,
} from '@/api/handlers/intercom-canvas.handler';
import { createHealthCheckHandler } from '@/api/handlers/intercom-health-check.handler';
import { createUninstallHandler } from '@/api/handlers/intercom-uninstall.handler';
import { createSlackCommandsRouter } from '@/api/handlers/slack-commands.handler';
import { createSlackEventsRouter } from '@/api/handlers/slack-events.handler';
import { createSlackInteractiveRouter } from '@/api/handlers/slack-interactive.handler';
import { handleWorkspaceLogoUpload } from '@/api/handlers/workspace-logo.handler';
import { createResolveHandler } from '@/api/handlers/zendesk-app.handler';
import {
  createAppOAuthCompleteHandler,
  createAppOAuthInitiateHandler,
} from '@/api/handlers/zendesk-app-oauth.handler';
import {
  createConnectCompleteHandler,
  createConnectInitiateHandler,
} from '@/api/handlers/zendesk-connect.handler';
import { createZendeskSessionHandler } from '@/api/handlers/zendesk-session.handler';
import { inngestServeHandler } from '@/api/inngest/serve';
import { createMcpHandler } from '@/api/mcp';
import { verifyIntercomSignature } from '@/api/middleware/intercom-signature';
import { type SlackSignatureEnv, verifySlackSignature } from '@/api/middleware/slack-signature';
import { captureException } from '@/api/posthog';
import { apiRouter } from '@/api/routes/api.router';
import { billingWebhookRoute } from '@/api/routes/billing/billing-webhook.route.setup';
import {
  domainService,
  integrationRepo,
  intercomCanvasService,
  intercomHealthCheckService,
  linkRepo,
  linkService,
  projectService,
  recordingRepo,
  recordingService,
  slackCanvasService,
  userService,
  workspaceMemberService,
  workspaceRepo,
  workspaceService,
  zendeskAppOAuthService,
  zendeskConnectService,
} from '@/api/services';

const app = new Hono();

const openAPIHandler = new OpenAPIHandler(apiRouter, {
  interceptors: [
    onError((error) => {
      if (!isDefinedError(error)) {
        captureException(error);
      }
    }),
  ],
});

// Log configuration on startup
logConfig();

// Serve favicon locally for SEO and browser compatibility
app.get('/favicon.ico', serveStatic({ path: './public/favicon.svg' }));
app.get('/favicon.svg', serveStatic({ path: './public/favicon.svg' }));

// Middleware
app.use('*', honoLogger());

// Public endpoints that allow any origin (called from customer websites)
// These need permissive CORS since the origin is the customer's domain
app.use(
  '/api/v1/domains/verify',
  cors({
    origin: '*',
    credentials: false,
    maxAge: env.cors.maxAge,
  })
);

// Session endpoints are called by the embed script running on customer websites
app.use(
  '/api/v1/session/*',
  cors({
    origin: '*',
    credentials: false,
    maxAge: env.cors.maxAge,
  })
);
app.use(
  '/api/v1/session',
  cors({
    origin: '*',
    credentials: false,
    maxAge: env.cors.maxAge,
  })
);

// Zendesk connect + app OAuth — called from dashboard popup (needs credentials for session cookies)
// Must come before the permissive /api/v1/zendesk/* rule
for (const path of [
  '/api/v1/zendesk/connect',
  '/api/v1/zendesk/connect/*',
  '/api/v1/zendesk/app/*',
]) {
  app.use(
    path,
    cors({
      origin: env.cors.origins,
      credentials: true,
      maxAge: env.cors.maxAge,
    })
  );
}

// Zendesk iframe endpoints need permissive CORS (called from Zendesk iframe via ZAF proxy)
app.use(
  '/api/v1/zendesk/*',
  cors({
    origin: '*',
    credentials: false,
    maxAge: env.cors.maxAge,
  })
);

// Public API endpoints - called from external services, no cookies needed
app.use(
  '/api/v1/public/*',
  cors({
    origin: '*',
    credentials: false,
    maxAge: env.cors.maxAge,
  })
);

// OAuth well-known endpoints - called by MCP clients during discovery, any origin
app.use(
  '/.well-known/*',
  cors({
    origin: '*',
    credentials: false,
    maxAge: env.cors.maxAge,
  })
);

// MCP endpoint - called from AI tools (Claude, Cursor, VS Code), no cookies
app.use(
  '/mcp',
  cors({
    origin: '*',
    credentials: false,
    maxAge: env.cors.maxAge,
  })
);

// OAuth 2.0 protocol endpoints called by MCP clients (DCR, token exchange, revocation).
// These use client_id/secret or authorization codes, not cookies, so any origin is safe.
// Note: /api/auth/oauth2/consent and /api/auth/oauth2/public-client are called by the
// dashboard with credentials — those fall through to the default CORS rule below.
for (const path of [
  '/api/auth/oauth2/register',
  '/api/auth/oauth2/token',
  '/api/auth/oauth2/revoke',
]) {
  app.use(
    path,
    cors({
      origin: '*',
      credentials: false,
      maxAge: env.cors.maxAge,
    })
  );
}

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

  // Share recording (public)
  app.use('/api/v1/share/*', rateLimitMiddlewares.public(rateLimiter));

  // Session initialization (stricter limit for recording init)
  app.use('/api/v1/session', rateLimitMiddlewares.session(rateLimiter));
  app.use('/api/v1/session/*', rateLimitMiddlewares.session(rateLimiter));

  // Webhook endpoints (high limit to ensure processing)
  app.use(
    '/api/webhooks/billing',
    createRateLimitMiddleware(rateLimiter, {
      tier: 'webhook',
      getIdentifier: getClientIP,
    })
  );

  // MCP endpoint (per-IP rate limiting before auth)
  app.use(
    '/mcp',
    createRateLimitMiddleware(rateLimiter, {
      tier: 'mcp',
      getIdentifier: getClientIP,
    })
  );

  // Note: Intercom Canvas rate limiting is handled inside the routers
  // after signature verification, using workspace_id as identifier
}

// Billing webhook route - direct DodoPayments webhook processing
app.post('/api/webhooks/billing', billingWebhookRoute);

// OAuth 2.1 Well-Known Endpoints (RFC 9728 + RFC 8414)
// MCP clients discover these during the authorization handshake.
// The protected-resource endpoint is static; the auth-server and OIDC endpoints
// are derived from the OAuth Provider plugin config to avoid drift.
// PRM response body — shared by the canonical and fallback routes
const protectedResourceMetadata = {
  resource: `${env.auth.url}/mcp`,
  authorization_servers: [`${env.auth.url}/api/auth`],
  scopes_supported: ['openid', 'profile', 'email', 'mcp:tools'],
  bearer_methods_supported: ['header'],
} as const;

// Canonical path per RFC 9728 — appends the resource path suffix
app.get('/.well-known/oauth-protected-resource/mcp', (c) =>
  c.json(protectedResourceMetadata, 200, { 'Cache-Control': 'public, max-age=3600' })
);

// Fallback for clients that omit the resource path
app.get('/.well-known/oauth-protected-resource', (c) =>
  c.json(protectedResourceMetadata, 200, { 'Cache-Control': 'public, max-age=3600' })
);

const authServerMetadataHandler = oauthProviderAuthServerMetadata(auth);
const openIdConfigHandler = oauthProviderOpenIdConfigMetadata(auth);

app.get('/.well-known/oauth-authorization-server/api/auth', (c) =>
  authServerMetadataHandler(c.req.raw)
);

app.get('/.well-known/openid-configuration/api/auth', (c) => openIdConfigHandler(c.req.raw));

// Fallback root discovery for clients that use a path-less authorization_servers URL
app.get('/.well-known/oauth-authorization-server', (c) => authServerMetadataHandler(c.req.raw));

app.get('/.well-known/openid-configuration', (c) => openIdConfigHandler(c.req.raw));

// OAuth 2.1 DCR workaround — force public client registration
// Claude Desktop (and other MCP clients) send token_endpoint_auth_method: "client_secret_post",
// but Better Auth's oauth-provider rejects unauthenticated confidential DCR with 401.
// MCP clients are always public (PKCE-protected, no stored secrets), so rewrite to "none".
// Tracked upstream: https://github.com/better-auth/better-auth/issues/8588
app.post('/api/auth/oauth2/register', async (c) => {
  const body = await c.req.json();
  if (body.token_endpoint_auth_method !== 'none') {
    body.token_endpoint_auth_method = 'none';
  }
  return auth.handler(
    new Request(c.req.raw.url, {
      method: 'POST',
      headers: c.req.raw.headers,
      body: JSON.stringify(body),
    })
  );
});

// Better Auth routes - must come before API routes
app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

// MCP Server — Streamable HTTP transport, authenticated via OAuth 2.1
const mcpHandler = createMcpHandler({
  linkService,
  recordingService,
  workspaceService,
  workspaceMemberService,
  projectService,
  domainService,
  userService,
  workspaceRepo,
  recordingRepo,
  linkRepo,
  rateLimiter,
});

// POST = JSON-RPC messages, GET = SSE stream, DELETE = session termination.
// OPTIONS is handled by the CORS middleware — NOT routed here to avoid 401 on preflight.
app.on(['POST', 'GET', 'DELETE'], '/mcp', mcpHandler);

// Intercom Canvas Kit Routes
// ===========================
// Per Intercom docs: developers.intercom.com/docs/canvas-kit
//
// Split endpoints for Messenger (customer-facing) and Inbox (teammate) contexts.
// Each endpoint explicitly handles a single context for clarity and type-safety.
//
// 1. Messenger (Customer-facing cards) - /api/v1/intercom/canvas/messenger/*
//    - Configured under: "For users, leads, and visitors"
//    - /configure - Teammate configures card before sending
//    - /initialize - Customer opens card
//    - /submit - Customer interacts with card
//
// 2. Inbox (Teammate sidebar app) - /api/v1/intercom/canvas/inbox/*
//    - Configured under: "For teammates"
//    - /initialize - Teammate opens app
//    - /submit - Teammate interacts with app

/**
 * Extract Intercom workspace_id from parsed body for rate limiting
 * Falls back to IP if workspace_id not available (shouldn't happen for valid requests)
 */
function getIntercomWorkspaceId(c: Context): string {
  try {
    const rawBody = c.get('rawBody') as string | undefined;
    if (rawBody) {
      const body = JSON.parse(rawBody) as { workspace_id?: string };
      if (body.workspace_id) {
        return `intercom:${body.workspace_id}`;
      }
    }
  } catch {
    // Fall through to IP-based
  }
  return getClientIP(c);
}

// Intercom rate limiting middleware (applied after signature verification)
const intercomRateLimitMiddleware = rateLimiter.isAvailable()
  ? createRateLimitMiddleware(rateLimiter, {
      tier: 'webhook',
      getIdentifier: getIntercomWorkspaceId,
    })
  : undefined;

// Messenger routes (for users, leads, and visitors)
const messengerRouter = new Hono();
messengerRouter.use('*', verifyIntercomSignature(env.intercom.clientSecret));
if (intercomRateLimitMiddleware) {
  messengerRouter.use('*', intercomRateLimitMiddleware);
}
messengerRouter.post('/initialize', createMessengerInitializeHandler(intercomCanvasService));
messengerRouter.post('/submit', createMessengerSubmitHandler(intercomCanvasService));
messengerRouter.post('/configure', createMessengerConfigureHandler(intercomCanvasService));

// Inbox routes (for teammates)
const inboxRouter = new Hono();
inboxRouter.use('*', verifyIntercomSignature(env.intercom.clientSecret));
if (intercomRateLimitMiddleware) {
  inboxRouter.use('*', intercomRateLimitMiddleware);
}
inboxRouter.post('/initialize', createInboxInitializeHandler(intercomCanvasService));
inboxRouter.post('/submit', createInboxSubmitHandler(intercomCanvasService));

// Health check route (installation health check)
const healthCheckRouter = new Hono();
healthCheckRouter.use('*', verifyIntercomSignature(env.intercom.clientSecret));
if (intercomRateLimitMiddleware) {
  healthCheckRouter.use('*', intercomRateLimitMiddleware);
}
healthCheckRouter.post('/', createHealthCheckHandler(intercomHealthCheckService));

// Uninstall webhook route (app uninstalled from Intercom)
const uninstallRouter = new Hono();
uninstallRouter.use('*', verifyIntercomSignature(env.intercom.clientSecret));
if (intercomRateLimitMiddleware) {
  uninstallRouter.use('*', intercomRateLimitMiddleware);
}
uninstallRouter.post('/', createUninstallHandler({ integrationRepo, cacheService }));

// Mount canvas routes
app.route('/api/v1/intercom/canvas/messenger', messengerRouter);
app.route('/api/v1/intercom/canvas/inbox', inboxRouter);
app.route('/api/v1/intercom/health-check', healthCheckRouter);
app.route('/api/v1/intercom/uninstall', uninstallRouter);

// Slack Webhook Routes
// ===========================
// Events API, Interactive components, and Slash commands
// All routes require Slack signature verification

// Slack rate limiting middleware (applied after signature verification)
const slackRateLimitMiddleware = rateLimiter.isAvailable()
  ? createRateLimitMiddleware(rateLimiter, {
      tier: 'webhook',
      getIdentifier: getClientIP,
    })
  : undefined;

// Slack Events route
const slackEventsRouter = new Hono<SlackSignatureEnv>();
slackEventsRouter.use('*', verifySlackSignature(env.slack.signingSecret));
if (slackRateLimitMiddleware) {
  slackEventsRouter.use('*', slackRateLimitMiddleware);
}
slackEventsRouter.route('/', createSlackEventsRouter(slackCanvasService));

// Slack Interactive route
const slackInteractiveRouter = new Hono<SlackSignatureEnv>();
slackInteractiveRouter.use('*', verifySlackSignature(env.slack.signingSecret));
if (slackRateLimitMiddleware) {
  slackInteractiveRouter.use('*', slackRateLimitMiddleware);
}
slackInteractiveRouter.route('/', createSlackInteractiveRouter(slackCanvasService));

// Slack Commands route
const slackCommandsRouter = new Hono<SlackSignatureEnv>();
slackCommandsRouter.use('*', verifySlackSignature(env.slack.signingSecret));
if (slackRateLimitMiddleware) {
  slackCommandsRouter.use('*', slackRateLimitMiddleware);
}
slackCommandsRouter.route('/', createSlackCommandsRouter(slackCanvasService));

// Mount Slack routes
app.route('/api/v1/slack/events', slackEventsRouter);
app.route('/api/v1/slack/interactive', slackInteractiveRouter);
app.route('/api/v1/slack/commands', slackCommandsRouter);

// Zendesk Connect Routes (popup OAuth flow from Zendesk iframe app)
// ===========================
const zendeskConnectRouter = new Hono();
zendeskConnectRouter.post('/', createConnectInitiateHandler(zendeskConnectService));
zendeskConnectRouter.post('/complete', createConnectCompleteHandler(zendeskConnectService));

app.route('/api/v1/zendesk/connect', zendeskConnectRouter);

// Zendesk App OAuth Routes (built-in app OAuth flow)
// ===========================
const zendeskAppOAuthRouter = new Hono();
zendeskAppOAuthRouter.post('/app/authorize', createAppOAuthInitiateHandler(zendeskAppOAuthService));
zendeskAppOAuthRouter.post('/app/token', createAppOAuthCompleteHandler(zendeskAppOAuthService));

app.route('/api/v1/zendesk', zendeskAppOAuthRouter);

// Zendesk App Routes
// ===========================
// Called from Zendesk iframe app, authenticated via ZAF JWT session
// Zendesk resolve endpoint — called server-to-server from dashboard, secured by internal API key
// Note: Zendesk app endpoints (links, projects, domains, status, me) are now ORPC routes
app.get('/api/v1/zendesk/resolve', createResolveHandler({ integrationRepo }));

// Zendesk session endpoint — exchanges ZAF-signed JWT for short-lived session JWT
// Rate limiting is done inside the handler (after JWT verification) keyed by workspace,
// because the Zendesk proxy shares IPs across all customers.
app.post(
  '/api/v1/zendesk/session',
  createZendeskSessionHandler({ jwtSecret: env.zendesk.jwtSecret, integrationRepo, rateLimiter })
);

// Workspace logo upload route (multipart/form-data - handled before OpenAPI)
// This route handles file uploads which require special multipart handling
app.post('/api/v1/workspace/:workspaceId/logo', handleWorkspaceLogoUpload);

// Inngest serve handler - handles background function invocations
app.on(['GET', 'PUT', 'POST'], '/api/inngest', inngestServeHandler);

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
if (env.server.nodeEnv === 'development') {
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
}

// 404 handler
app.notFound((c) => {
  const isPublicApi = c.req.path.startsWith('/api/v1/public/');
  return c.json(
    {
      error: 'NOT_FOUND',
      message: isPublicApi
        ? `No endpoint found for ${c.req.method} ${c.req.path}. See https://docs.userplane.io/api/introduction`
        : 'Not Found',
      path: c.req.path,
    },
    404
  );
});

// Error handler
app.onError((err, c) => {
  // Capture application level error in PostHog with request context
  if (!isDefinedError(err)) {
    captureException(err, undefined, {
      request_path: c.req.path,
      request_method: c.req.method,
    });
  }

  const isPublicApi = c.req.path.startsWith('/api/v1/public/');
  return c.json(
    {
      error: 'INTERNAL_SERVER_ERROR',
      message: isPublicApi
        ? 'An unexpected error occurred. Please try again or contact support. See https://docs.userplane.io/api/error-handling'
        : err.message,
    },
    500
  );
});

export default {
  port: env.server.port,
  hostname: env.server.host,
  fetch: app.fetch,
  idleTimeout: 30, // seconds -- prevent premature connection drops on slow upstream calls
};
