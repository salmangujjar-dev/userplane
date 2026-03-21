/**
 * Zendesk App errors
 * For Zendesk iframe app endpoints (links, projects, domains, status)
 * Status codes follow HTTP semantics:
 *   401 - Unauthorized (API token validation)
 *   403 - Forbidden (authorization / limit errors)
 *   404 - Not Found (agent not found)
 */
export const ZendeskAppErrors = {
  // Authentication errors
  ZENDESK_APP_UNAUTHORIZED: {
    status: 401,
    message: 'Missing or invalid API token',
  },

  // Authorization errors
  ZENDESK_APP_AGENT_NOT_MEMBER: {
    status: 403,
    message: 'Agent is not a member of this workspace',
  },
  ZENDESK_APP_RECORDING_LIMIT_EXCEEDED: {
    status: 403,
    message: 'Recording limit exceeded for this workspace',
  },
  ZENDESK_APP_WORKSPACE_MISMATCH: {
    status: 403,
    message: 'Workspace mismatch',
  },

  // Not found errors
  ZENDESK_APP_AGENT_NOT_FOUND: {
    status: 404,
    message: 'Agent not found as a Userplane user',
  },
} as const;
