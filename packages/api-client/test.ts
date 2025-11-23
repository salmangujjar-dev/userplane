import type { AppType } from 'api';
import { hc } from 'hono/client';

const client = hc<AppType>('http://localhost:3001/api/v1');
type ClientType = typeof client;
