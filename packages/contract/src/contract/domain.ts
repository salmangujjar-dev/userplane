import { oc } from '@orpc/contract';
import { VerifyDomainSchema, DomainVerificationDataSchema, ApiResponseSchema } from '../schemas';

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
    summary: 'Verify domain',
    description: 'Verify domain ownership using verification token',
    tags: ['Domains'],
    inputStructure: 'detailed',
  })
  .input(VerifyDomainSchema)
  .output(ApiResponseSchema(DomainVerificationDataSchema));
