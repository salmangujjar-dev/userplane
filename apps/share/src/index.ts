import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import { serveStatic } from 'hono/bun';
import createRouter from '@/share/lib/create-router';
import { registerRoutes } from '@/share/routes';
import { env, logConfig } from '@/share/env';
import { createAppLogger } from '@workspace/logger';
import { linkService } from '@/share/services/links.service';

const app = new Hono();
const logger = createAppLogger('share');

logConfig();

app.get('/favicon.ico', serveStatic({ path: './public/favicon.svg' }));
app.get('/favicon.svg', serveStatic({ path: './public/favicon.svg' }));

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

const apiRoutes = registerRoutes(createRouter());
app.route('/api/v1', apiRoutes);

/**
 * Short code redirect handler
 * This is the main functionality - redirect /:shortCode to target URL
 */
app.get('/:shortCode', (c) => {
  const shortCode = c.req.param('shortCode');

  if (
    !shortCode ||
    shortCode === 'api' ||
    shortCode === 'favicon.ico' ||
    shortCode === 'favicon.svg'
  ) {
    return c.json(
      {
        error: 'Not Found',
        message: 'Invalid short code',
      },
      404
    );
  }

  const targetUrl = linkService.getTargetUrl(shortCode);

  if (!targetUrl) {
    logger.info({ shortCode }, 'Short code not found or inactive');
    return c.json(
      {
        error: 'Not Found',
        message: 'Short link not found or has expired',
      },
      404
    );
  }

  logger.info({ shortCode, targetUrl }, 'Redirecting');
  return c.redirect(targetUrl, 302);
});

app.notFound((c) => {
  return c.json(
    {
      error: 'Not Found',
      path: c.req.path,
    },
    404
  );
});

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
