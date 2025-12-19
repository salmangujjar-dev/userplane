/**
 * Domain contract implementation using oRPC
 * Implements the standalone domain contract for public domain verification
 */

import { ORPCError, implement } from '@orpc/server';
import { contract } from '@workspace/contract';
import type { DomainService } from '@/api/services/domain.service';
import { ValidationError, NotFoundError } from '@/api/lib/errors';

/**
 * Initial context with headers
 */
type InitialContext = {
  headers: Headers;
};

/**
 * Public base for domain endpoints (no auth required)
 */
const base = implement(contract).$context<InitialContext>();

/**
 * POST /domains/verify - Verify domain ownership
 * Public endpoint - no authentication required
 */
export const verifyDomainImpl = (domainService: DomainService) => {
  return base.domain.verify.handler(async ({ input, context }) => {
    try {
      // Extract origin from headers (sent by the verification script)
      const headers = context.headers as Headers;
      const origin = headers.get('origin') || headers.get('referer') || '';

      // Parse hostname from origin
      let originHostname = '';
      try {
        const originUrl = new URL(origin);
        originHostname = originUrl.hostname;
      } catch {
        throw new ValidationError('Invalid origin header');
      }

      const domain = await domainService.verifyDomain(input.token, originHostname);

      return {
        message: 'Domain verified successfully',
        data: {
          domainStatus: domain.domainStatus,
          workspaceId: domain.workspaceId,
          domainId: domain.domainId,
          domainUrl: domain.domainUrl,
        },
      };
    } catch (error) {
      if (error instanceof ValidationError) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        });
      }
      if (error instanceof NotFoundError) {
        throw new ORPCError('NOT_FOUND', {
          message: error.message,
        });
      }
      if (error instanceof Error) {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
          message: error.message,
        });
      }
      throw error;
    }
  });
};

/**
 * Create the domain procedures object
 */
export const createDomainProcedures = (domainService: DomainService) => {
  return {
    verify: verifyDomainImpl(domainService),
  };
};
