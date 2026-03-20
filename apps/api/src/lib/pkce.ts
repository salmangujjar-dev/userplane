/**
 * PKCE (Proof Key for Code Exchange) utility for OAuth 2.0 public clients
 * Implements RFC 7636 with S256 challenge method
 */

import crypto from 'node:crypto';

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Generate a PKCE code_verifier / code_challenge pair (S256)
 */
export function generatePKCE(): PKCEPair {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}
