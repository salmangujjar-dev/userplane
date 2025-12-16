import createRouter from '@/api/lib/create-router';
import { domainService } from '@/api/services';
import { createDomainRoutes } from './domains.routes';

const app = createRouter();
const domainRoutes = createDomainRoutes(domainService);
app.route('/domains', domainRoutes);

export default app;
