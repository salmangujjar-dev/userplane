/**
 * JWT Utilities
 * Client-side JWT decoding (not verification)
 */

/**
 * Decode a JWT token payload (client-side only, does not verify signature)
 * @throws Error if token format is invalid
 */
export function decodeJwtPayload<T = unknown>(token: string): T {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format: expected 3 parts');
  }

  const payload = parts[1];
  if (!payload) {
    throw new Error('Invalid JWT: missing payload');
  }

  try {
    // Handle base64url encoding (replace URL-safe chars)
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(base64);
    return JSON.parse(decoded) as T;
  } catch (error) {
    throw new Error('Invalid JWT: failed to decode payload');
  }
}

/**
 * Check if a JWT token is expired
 */
export function isJwtExpired(token: string): boolean {
  try {
    const payload = decodeJwtPayload<{ exp?: number }>(token);
    if (!payload.exp) {
      return false; // No expiry set
    }
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true; // Invalid token treated as expired
  }
}

/**
 * Get time until JWT expiry in milliseconds
 * Returns negative number if already expired
 */
export function getJwtTimeToExpiry(token: string): number | null {
  try {
    const payload = decodeJwtPayload<{ exp?: number }>(token);
    if (!payload.exp) {
      return null; // No expiry set
    }
    return payload.exp * 1000 - Date.now();
  } catch {
    return null;
  }
}
