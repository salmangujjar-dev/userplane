/**
 * Slack integration errors
 * From SlackCanvasService, signature verification middleware, and OAuth service
 * Status codes follow HTTP semantics:
 *   401 - Unauthorized (signature verification failed)
 *   403 - Forbidden (authorization errors)
 *   404 - Not Found (resource not found)
 *   500 - Internal Server Error (infrastructure errors)
 */
export const SlackErrors = {
  // Authentication errors
  SLACK_INVALID_SIGNATURE: {
    status: 401,
    message: 'Invalid request signature',
  },
  SLACK_MISSING_SIGNATURE: {
    status: 401,
    message: 'Missing X-Slack-Signature header',
  },
  SLACK_TIMESTAMP_EXPIRED: {
    status: 401,
    message: 'Request timestamp too old',
  },
  SLACK_TOKEN_REVOKED: {
    status: 401,
    message: 'Slack token has been revoked',
  },

  // Authorization errors
  SLACK_USER_NOT_MEMBER: {
    status: 403,
    message: 'User is not a member of the workspace',
  },
  SLACK_RECORDING_LIMIT_EXCEEDED: {
    status: 403,
    message: 'Recording limit exceeded for your plan',
  },

  // Not found errors
  SLACK_INTEGRATION_NOT_FOUND: {
    status: 404,
    message: 'Slack integration not found',
  },
  SLACK_WORKSPACE_NOT_FOUND: {
    status: 404,
    message: 'Workspace not found',
  },
  SLACK_PROJECT_NOT_FOUND: {
    status: 404,
    message: 'Project not found',
  },
  SLACK_DOMAIN_NOT_FOUND: {
    status: 404,
    message: 'Domain not found',
  },
  SLACK_USER_NOT_FOUND: {
    status: 404,
    message: 'User not found',
  },

  // Infrastructure errors
  SLACK_LINK_CREATE_FAILED: {
    status: 500,
    message: 'Failed to create recording link',
  },
  SLACK_API_ERROR: {
    status: 500,
    message: 'An error occurred while communicating with Slack',
  },
} as const;
