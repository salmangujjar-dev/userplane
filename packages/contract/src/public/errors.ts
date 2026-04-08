/**
 * Public API error definitions
 * Used by both the public API (API key auth) and the API key management endpoints
 */

export const PublicApiErrors = {
  // Authentication errors
  API_KEY_REQUIRED: {
    status: 401,
    message: 'API key required. Use Authorization: Bearer <key>',
  },
  API_KEY_INVALID: {
    status: 401,
    message: 'Invalid API key.',
  },
  API_KEY_EXPIRED: {
    status: 401,
    message: 'API key has expired.',
  },

  // Authorization errors
  API_KEY_DISABLED: {
    status: 403,
    message: 'API key is disabled.',
  },
  NOT_A_MEMBER: {
    status: 403,
    message: 'Not a member of this workspace.',
  },

  // Rate limiting
  RATE_LIMITED: {
    status: 429,
    message: 'Rate limit exceeded. Please try again later.',
  },
} as const;

export const ApiKeyErrors = {
  // Authentication
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to manage API keys.',
  },

  // Conflict
  API_KEY_ALREADY_EXISTS: {
    status: 409,
    message: 'You already have an API key. Revoke or rotate it instead.',
  },

  // Not found
  API_KEY_NOT_FOUND: {
    status: 404,
    message: 'No API key found.',
  },

  // Infrastructure
  API_KEY_CREATE_FAILED: {
    status: 500,
    message: 'Failed to create API key.',
  },
  API_KEY_REVOKE_FAILED: {
    status: 500,
    message: 'Failed to revoke API key.',
  },
  API_KEY_ROTATE_FAILED: {
    status: 500,
    message: 'Failed to rotate API key.',
  },
} as const;
