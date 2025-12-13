/**
 * Domain routes index
 * Sets up domain verification routes with dependencies
 */

import createRouter from '@/api/lib/create-router';
import { createDomainRoutes } from './domains.routes';
import { DomainService } from '@/api/services/domain.service';
import { DomainRepository } from '@/api/repositories/domains.repository';
import { tokenService } from '@/api/services/token.service';
import { db } from '@/api/clients/db';

// Initialize repositories
const domainRepo = new DomainRepository(db);

// Initialize service with dependencies
const domainService = new DomainService({
  domainRepo,
  tokenService,
});

// Create and mount routes
const app = createRouter();
const domainRoutes = createDomainRoutes(domainService);
app.route('/domains', domainRoutes);

export default app;
