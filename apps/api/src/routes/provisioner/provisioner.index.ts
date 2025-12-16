import { Hono } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { provisionerService } from '@/api/services';
import { createProvisionerRoutes } from './provisioner.routes';

const provisionerRoutes = createProvisionerRoutes(provisionerService);

const app = new Hono<AppEnv>();
app.route('/', provisionerRoutes);

export default app;
