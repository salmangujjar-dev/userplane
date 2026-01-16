/**
 * Pagination constants
 * Per-page limits and defaults for all paginated resources
 * Used across API contracts for consistent pagination behavior
 */

/**
 * Workspace pagination limits
 * List workspaces for a user
 */
export const WORKSPACE_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 20,
  /** Default items per page */
  DEFAULT_PER_PAGE: 10,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Workspace members pagination limits
 * List members in a workspace
 */
export const WORKSPACE_MEMBERS_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 10,
  /** Default items per page */
  DEFAULT_PER_PAGE: 5,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Domain pagination limits
 * List domains in a workspace
 */
export const DOMAIN_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 10,
  /** Default items per page */
  DEFAULT_PER_PAGE: 5,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Recording pagination limits
 * List recordings in a workspace
 */
export const RECORDING_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 20,
  /** Default items per page */
  DEFAULT_PER_PAGE: 10,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Project pagination limits
 * List projects in a workspace
 */
export const PROJECT_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 10,
  /** Default items per page */
  DEFAULT_PER_PAGE: 5,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Link pagination limits
 * List links in a workspace
 */
export const LINK_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 20,
  /** Default items per page */
  DEFAULT_PER_PAGE: 10,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Search result limits
 * Used for workspace search across different resource types
 */
export const SEARCH_PAGINATION = {
  /** Maximum search results */
  MAX_LIMIT: 20,
  /** Default search results */
  DEFAULT_LIMIT: 5,
  /** Minimum search results */
  MIN_LIMIT: 1,
} as const;

/**
 * Workspace suggestions pagination limits
 * List suggested workspaces based on email domain
 */
export const WORKSPACE_SUGGESTIONS_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 5,
  /** Default items per page */
  DEFAULT_PER_PAGE: 5,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Admin users search pagination limits
 * Admin search and list of all users
 */
export const ADMIN_USERS_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 100,
  /** Default items per page */
  DEFAULT_PER_PAGE: 10,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Admin user sessions pagination limits
 * List sessions for a specific user in admin view
 */
export const ADMIN_USER_SESSIONS_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 10,
  /** Default items per page */
  DEFAULT_PER_PAGE: 5,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Admin user workspaces pagination limits
 * List workspaces for a specific user in admin view
 */
export const ADMIN_USER_WORKSPACES_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 20,
  /** Default items per page */
  DEFAULT_PER_PAGE: 10,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Admin workspaces search pagination limits
 * Admin search and list of all workspaces
 */
export const ADMIN_WORKSPACES_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 100,
  /** Default items per page */
  DEFAULT_PER_PAGE: 10,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Admin workspace members pagination limits
 * List members in a workspace from admin view
 */
export const ADMIN_WORKSPACE_MEMBERS_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 20,
  /** Default items per page */
  DEFAULT_PER_PAGE: 10,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Admin workspace projects pagination limits
 * Admin view of projects in a workspace with search and filters
 */
export const ADMIN_WORKSPACE_PROJECTS_PAGINATION = {
  /** Maximum items per page */
  MAX_PER_PAGE: 20,
  /** Default items per page */
  DEFAULT_PER_PAGE: 5,
  /** Minimum items per page */
  MIN_PER_PAGE: 1,
} as const;

/**
 * Complete pagination constants
 * Export all pagination limits for easy import
 */
export const PAGINATION_CONSTANTS = {
  WORKSPACE: WORKSPACE_PAGINATION,
  WORKSPACE_MEMBERS: WORKSPACE_MEMBERS_PAGINATION,
  DOMAIN: DOMAIN_PAGINATION,
  RECORDING: RECORDING_PAGINATION,
  PROJECT: PROJECT_PAGINATION,
  LINK: LINK_PAGINATION,
  SEARCH: SEARCH_PAGINATION,
  WORKSPACE_SUGGESTIONS: WORKSPACE_SUGGESTIONS_PAGINATION,
  ADMIN_USERS: ADMIN_USERS_PAGINATION,
  ADMIN_USER_SESSIONS: ADMIN_USER_SESSIONS_PAGINATION,
  ADMIN_USER_WORKSPACES: ADMIN_USER_WORKSPACES_PAGINATION,
  ADMIN_WORKSPACES: ADMIN_WORKSPACES_PAGINATION,
  ADMIN_WORKSPACE_MEMBERS: ADMIN_WORKSPACE_MEMBERS_PAGINATION,
  ADMIN_WORKSPACE_PROJECTS: ADMIN_WORKSPACE_PROJECTS_PAGINATION,
} as const;
