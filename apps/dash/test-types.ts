import { hc } from 'hono/client';
import type { router } from '@workspace/api/routes';

const api = hc<router>('http://localhost:3001');

// Log the type structure
type X = typeof api;
