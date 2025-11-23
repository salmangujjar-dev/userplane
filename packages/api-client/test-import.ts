import type { Router } from 'api/routes';
import { hc } from 'hono/client';

const testClient = hc<Router>('http://localhost:3001');
type TestClient = typeof testClient;

console.log('Types:', typeof testClient);
