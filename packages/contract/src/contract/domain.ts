import { oc } from '@orpc/contract';

import {
  ApiResponseSchema,
  DomainErrors,
  DomainVerificationDataSchema,
  VerifyDomainSchema,
} from '../schemas';

/**
 * Domain contract
 * Public endpoint for domain verification
 * Note: Domain preferences are managed under workspace routes, not here
 */

/**
 * POST /domains/verify
 * Verify domain ownership
 */
export const verifyDomain = oc
  .route({
    method: 'POST',
    path: '/domains/verify',
    inputStructure: 'detailed',
    summary: 'Verify domain',
    description: 'Verify domain ownership using verification token',
    tags: ['Domains'],
  })
  .errors({
    DOMAIN_VERIFICATION_TOKEN_INVALID: DomainErrors.DOMAIN_VERIFICATION_TOKEN_INVALID,
    DOMAIN_NOT_REGISTERED: DomainErrors.DOMAIN_NOT_REGISTERED,
    DOMAIN_WORKSPACE_MISMATCH: DomainErrors.DOMAIN_WORKSPACE_MISMATCH,
    DOMAIN_URL_INVALID: DomainErrors.DOMAIN_URL_INVALID,
    DOMAIN_ORIGIN_INVALID: DomainErrors.DOMAIN_ORIGIN_INVALID,
    DOMAIN_ORIGIN_MISMATCH: DomainErrors.DOMAIN_ORIGIN_MISMATCH,
    DOMAIN_VERIFICATION_FAILED: DomainErrors.DOMAIN_VERIFICATION_FAILED,
    INTERNAL_SERVER_ERROR: DomainErrors.INTERNAL_SERVER_ERROR,
  })
  .input(VerifyDomainSchema)
  .output(ApiResponseSchema(DomainVerificationDataSchema));
