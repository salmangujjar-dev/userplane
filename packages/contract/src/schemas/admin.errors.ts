/**
 * Admin errors
 * From AdminService and admin middleware
 * Status codes follow HTTP semantics:
 *   400 - Bad Request (validation errors)
 *   401 - Unauthorized (authentication errors)
 *   403 - Forbidden (authorization errors)
 *   404 - Not Found (resource not found)
 */
export const AdminErrors = {
  // Authentication errors
  UNAUTHORIZED: {
    status: 401,
    message: 'You must be logged in to access this resource',
  },

  // Authorization errors
  NOT_ADMIN: {
    status: 403,
    message: 'Admin access required',
  },

  // Not found errors
  USER_NOT_FOUND: {
    status: 404,
    message: 'User not found',
  },

  SESSION_NOT_FOUND: {
    status: 404,
    message: 'Session not found',
  },

  // Validation errors
  INVALID_BAN_DURATION: {
    status: 400,
    message: 'Ban duration must be a positive number',
  },

  CANNOT_BAN_SELF: {
    status: 400,
    message: 'You cannot ban yourself',
  },

  CANNOT_BAN_ADMIN: {
    status: 400,
    message: 'You cannot ban another admin',
  },

  // Workspace errors
  WORKSPACE_NOT_FOUND: {
    status: 404,
    message: 'Workspace not found',
  },

  WORKSPACE_ALREADY_DEACTIVATED: {
    status: 400,
    message: 'Workspace is already deactivated',
  },

  WORKSPACE_RESTORE_TIME_EXPIRED: {
    status: 410,
    message: 'Workspace restoration window has expired',
  },

  WORKSPACE_RESTORE_FAILED: {
    status: 500,
    message: 'Failed to restore workspace',
  },

  // Project errors
  PROJECT_NOT_FOUND: {
    status: 404,
    message: 'Project not found',
  },

  PROJECT_GONE: {
    status: 410,
    message: 'Project has been deleted',
  },

  PROJECT_WORKSPACE_MISMATCH: {
    status: 403,
    message: 'Project does not belong to this workspace',
  },

  PROJECT_LAST_PROJECT_DELETE_FORBIDDEN: {
    status: 403,
    message: 'Cannot delete the only project in a workspace',
  },

  PROJECT_DELETE_FAILED: {
    status: 500,
    message: 'Failed to delete project',
  },

  PROJECT_RESTORE_WORKSPACE_DELETED: {
    status: 410,
    message: 'Cannot restore project because its workspace is deleted',
  },

  PROJECT_RESTORE_TIME_EXPIRED: {
    status: 410,
    message: 'Project restoration window has expired',
  },

  PROJECT_RESTORE_FAILED: {
    status: 500,
    message: 'Failed to restore project',
  },

  // Plan errors
  PLAN_NOT_FOUND: {
    status: 404,
    message: 'Plan product not found',
  },

  PLAN_CREATE_FAILED: {
    status: 502,
    message: 'Failed to create plan product in DodoPayments',
  },

  PLAN_UPDATE_FAILED: {
    status: 502,
    message: 'Failed to update plan product in DodoPayments',
  },

  // Admin workspace provisioning errors
  ADMIN_WORKSPACE_PROVISION_USER_CREATE_FAILED: {
    status: 502,
    message: 'Failed to create user account',
  },

  ADMIN_WORKSPACE_PROVISION_PLAN_CREATE_FAILED: {
    status: 502,
    message: 'Failed to create plan product in DodoPayments',
  },

  ADMIN_WORKSPACE_PROVISION_CHECKOUT_FAILED: {
    status: 502,
    message: 'Failed to create checkout session',
  },

  ADMIN_WORKSPACE_PROVISION_WORKSPACE_EXISTS: {
    status: 409,
    message: 'A workspace with this domain already exists',
  },

  ADMIN_WORKSPACE_PROVISION_PRODUCT_NOT_FOUND: {
    status: 404,
    message: 'Plan product not found',
  },

  // Subscription update errors
  SUBSCRIPTION_NOT_FOUND: {
    status: 404,
    message: 'No active subscription found for this workspace',
  },

  SUBSCRIPTION_UPDATE_FAILED: {
    status: 502,
    message: 'Failed to update subscription in DodoPayments',
  },

  // Trial errors
  TRIAL_NOT_ACTIVE: {
    status: 400,
    message: 'Subscription is not currently in a trial period',
  },

  TRIAL_EXTENSION_FAILED: {
    status: 502,
    message: 'Failed to extend trial in DodoPayments',
  },
} as const;
