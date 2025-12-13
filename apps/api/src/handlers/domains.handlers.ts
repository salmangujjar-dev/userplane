/**
 * Domain handlers - HTTP request handlers for domain operations
 * Handles domain verification and management
 */

import type { Context } from 'hono';
import type { AppEnv } from '@/api/lib/types';
import { DomainService } from '@/api/services/domain.service';
import { getErrorStatusCode, ValidationError } from '@/api/lib/errors';
import type { ApiResponse, ApiErrorResponse, DomainVerificationData } from '@/api/types';
import { verifyDomainSchema } from '@/api/schema';

/**
 * Handler for domain verification endpoint
 * Validates JWT token from recorder script and marks domain as verified
 */
export function verifyDomainHandler(domainService: DomainService) {
  return async (c: Context<AppEnv>) => {
    try {
      // Check Origin header
      const origin = c.req.header('Origin');
      if (!origin) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Origin header is required',
        };
        return c.json(response, 400);
      }

      // Extract hostname from origin
      let originHostname: string;
      try {
        const originUrl = new URL(origin);
        originHostname = originUrl.hostname;
      } catch {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Invalid Origin header',
        };
        return c.json(response, 400);
      }

      // Parse and validate request body
      const body = await c.req.json();
      const validation = verifyDomainSchema.safeParse(body);

      if (!validation.success) {
        const response: ApiErrorResponse = {
          error: 'Bad Request',
          message: 'Verification token is required',
        };
        return c.json(response, 400);
      }

      const { token } = validation.data;

      // Verify domain
      const domain = await domainService.verifyDomain(token, originHostname);

      const response: ApiResponse<DomainVerificationData> = {
        message: 'Domain verified successfully',
        data: {
          domainStatus: domain.domainStatus,
          workspaceId: domain.workspaceId,
          domainId: domain.id,
          domainUrl: domain.domainUrl,
        },
      };

      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        const response: ApiErrorResponse = {
          error: error.name,
          message: error.message,
        };
        return c.json(response, getErrorStatusCode(error));
      }

      const response: ApiErrorResponse = {
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      };
      return c.json(response, 500);
    }
  };
}
