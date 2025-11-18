import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { prettyJSON } from 'hono/pretty-json';
import users from './routes/users';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', prettyJSON());

// Routes
app.get('/', (c) => {
  return c.json({
    message: 'Welcome to Hono API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/v1',
    },
  });
});

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API v1 routes
const api = new Hono();

api.route('/users', users);

app.route('/api/v1', api);

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
  port: 3001,
  fetch: app.fetch,
};
