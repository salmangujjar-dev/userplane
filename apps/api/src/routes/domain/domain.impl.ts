/**
 * Domain contract implementation using oRPC
 * Implements the standalone domain contract for public domain verification
 */

import { implement } from '@orpc/server';
import { contract, domainError } from '@userplane/contract';

import { createLogger } from '@/api/lib/logger';
import type { DomainService } from '@/api/services/domain.service';

const logger = createLogger('domain-verification');

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
 * Service throws ORPCError directly, no error mapping needed
 */
export const verifyDomainImpl = (domainService: DomainService) => {
  return base.domain.verify.handler(async ({ input, context }) => {
    // Extract origin from headers (sent by the verification script)
    const headers = context.headers as Headers;
    const origin = headers.get('origin') || headers.get('referer') || '';

    // Parse hostname from origin
    let originHostname = '';
    try {
      const originUrl = new URL(origin);
      originHostname = originUrl.hostname;
    } catch {
      throw domainError.DOMAIN_ORIGIN_INVALID();
    }

    logger.debug(
      { originHostname, workspaceIds: input.body.workspaceIds },
      'Domain verification request received'
    );

    const domain = await domainService.verifyDomain(
      input.body.token,
      originHostname,
      input.body.workspaceIds
    );

    logger.debug({ domain }, 'Domain verified successfully');

    return {
      message: 'Domain verified successfully',
      data: {
        domainStatus: domain.domainStatus,
        workspaceId: domain.workspaceId,
        domainId: domain.domainId,
        domainUrl: domain.domainUrl,
      },
    };
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
