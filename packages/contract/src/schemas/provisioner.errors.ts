/**
 * Provisioner errors
 * From workspace provisioning (ProvisionerService, WorkspaceService, DomainService, WorkspaceMemberService)
 * Status codes follow HTTP semantics and match actual service implementation:
 *   401 - Unauthorized (authentication errors)
 *   500 - Internal Server Error (infrastructure errors)
 */
export const ProvisionerErrors = {
  // Authentication errors (from auth middleware)
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to access this resource',
  },

  // Infrastructure errors
  PROVISIONER_WORKSPACE_CREATE_FAILED: {
    status: 500,
    message: 'Failed to create workspace',
  },
  PROVISIONER_TRANSACTION_FAILED: {
    status: 500,
    message: 'Transaction failed',
  },

  // Rate limiting errors
  WORKSPACE_CREATION_LIMIT_EXCEEDED: {
    status: 429,
    message: 'You have reached the maximum number of workspaces allowed per year',
  },

  // Intercom OAuth errors
  INTERCOM_OAUTH_STATE_INVALID: {
    status: 400,
    message: 'Invalid or expired OAuth state. Please try connecting again.',
  },
  INTERCOM_TOKEN_EXCHANGE_FAILED: {
    status: 502,
    message: 'Failed to exchange authorization code with Intercom. Please try again.',
  },
  INTERCOM_USER_INFO_FAILED: {
    status: 502,
    message: 'Failed to retrieve user information from Intercom. Please try again.',
  },
  INTERCOM_WORKSPACE_ALREADY_CONNECTED: {
    status: 409,
    message: 'This Intercom workspace is already connected to another account',
  },
  INTERCOM_EMAIL_NOT_VERIFIED: {
    status: 403,
    message: 'Your Intercom email must be verified to connect your workspace',
  },

  // Zendesk OAuth errors
  ZENDESK_OAUTH_STATE_INVALID: {
    status: 400,
    message: 'Invalid or expired OAuth state. Please try connecting again.',
  },
  ZENDESK_TOKEN_EXCHANGE_FAILED: {
    status: 502,
    message: 'Failed to exchange authorization code with Zendesk. Please try again.',
  },
  ZENDESK_USER_INFO_FAILED: {
    status: 502,
    message: 'Failed to retrieve user information from Zendesk. Please try again.',
  },
  // Slack OAuth errors
  SLACK_OAUTH_STATE_INVALID: {
    status: 400,
    message: 'Invalid or expired OAuth state. Please try connecting again.',
  },
  SLACK_TOKEN_EXCHANGE_FAILED: {
    status: 502,
    message: 'Failed to exchange authorization code with Slack. Please try again.',
  },
  SLACK_AUTH_VALIDATION_FAILED: {
    status: 502,
    message: 'Failed to validate Slack bot token. Please try again.',
  },
  SLACK_WORKSPACE_ALREADY_CONNECTED: {
    status: 409,
    message: 'This Slack workspace is already connected to another account',
  },
} as const;
