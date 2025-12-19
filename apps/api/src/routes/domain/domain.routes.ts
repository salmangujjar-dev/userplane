/**
 * Domain routes - HTTP routes for domain verification
 * Public routes (no auth required - uses token-based authentication)
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { AppEnv } from '@/api/lib/types';
import { verifyDomainHandler } from '@/api/handlers/domains.handlers';
import type { DomainService } from '@/api/services/domain.service';

export function createDomainRoutes(domainService: DomainService) {
  const domainRoutes = new Hono<AppEnv>();

  // POST /domains/verify - Verify domain ownership
  // CORS: origin: * (allow any origin), methods: POST, credentials: false
  // Headers: Origin: https://app.example.com
  // Body: { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
  // Returns: { verified: true, workspaceId: "ws_abc123", domain: "app.example.com" }
  domainRoutes.post(
    '/verify',
    cors({
      origin: '*',
      credentials: false,
      allowMethods: ['POST'],
      allowHeaders: ['Content-Type', 'Origin'],
    }),
    verifyDomainHandler(domainService)
  );

  return domainRoutes;
}
