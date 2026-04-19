/**
 * Public API error definitions
 * Used by both the public API (API key auth) and the API key management endpoints
 */

export const PublicApiErrors = {
  // Validation errors
  BAD_REQUEST: {
    status: 400,
    message:
      'Invalid request parameters. Check the request body and query parameters. See https://docs.userplane.io/api/error-handling',
  },

  // Authentication errors
  API_KEY_REQUIRED: {
    status: 401,
    message:
      'API key is required. Include it as Authorization: Bearer <your-api-key>. See https://docs.userplane.io/api/authentication',
  },
  API_KEY_INVALID: {
    status: 401,
    message:
      'The provided API key is not valid. Verify the key and try again. See https://docs.userplane.io/api/authentication',
  },
  API_KEY_EXPIRED: {
    status: 401,
    message:
      'The API key has expired. Rotate or create a new key. See https://docs.userplane.io/api/authentication',
  },

  // Authorization errors
  API_KEY_DISABLED: {
    status: 403,
    message:
      'The API key is disabled. Enable it or create a new key. See https://docs.userplane.io/api/authentication',
  },
  NOT_A_MEMBER: {
    status: 403,
    message:
      'The API key owner is not a member of this workspace. See https://docs.userplane.io/api/error-handling',
  },

  // Rate limiting
  RATE_LIMITED: {
    status: 429,
    message:
      'Rate limit exceeded. Wait and retry with exponential backoff. See https://docs.userplane.io/api/rate-limits',
  },

  // Service errors
  SERVICE_UNAVAILABLE: {
    status: 503,
    message:
      'API key verification service is temporarily unavailable. Please try again later. See https://docs.userplane.io/api/error-handling',
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
