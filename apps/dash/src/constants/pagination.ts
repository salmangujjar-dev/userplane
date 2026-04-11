/**
 * Pagination constants for frontend hooks and queries
 * These should align with the backend pagination limits defined in the contract
 *
 * Why these defaults:
 * - Workspaces: Higher default (10) as users typically have few workspaces
 * - Members: Lower default (5) for compact UI components
 * - Domains: Lower default (5) as most workspaces have few domains
 * - Recordings: Higher default (16) for grid layouts (4x4)
 * - Projects: Lower default (5) for dropdown/selector components
 * - Links: Higher default (10) for list views
 * - Searchable: Even lower defaults (3-5) for search dropdown contexts
 */

/**
 * Default items per page for workspace list
 * Used in: useWorkspaces hook
 */
export const DEFAULT_WORKSPACES_PER_PAGE = 10;

/**
 * Default items per page for workspace members
 * Used in: useWorkspaceMembers hook
 */
export const DEFAULT_MEMBERS_PER_PAGE = 5;

/**
 * Default items per page for domains
 * Used in: useWorkspaceDomains hook
 */
export const DEFAULT_DOMAINS_PER_PAGE = 5;

/**
 * Default items per page for recordings
 * Used in: useWorkspaceRecordings hook
 * Set to 16 for 4x4 grid layout
 */
export const DEFAULT_RECORDINGS_PER_PAGE = 16;

/**
 * Default items per page for projects
 * Used in: useWorkspaceProjects hook
 */
export const DEFAULT_PROJECTS_PER_PAGE = 5;

/**
 * Default items per page for links
 * Used in: useWorkspaceLinks hook
 */
export const DEFAULT_LINKS_PER_PAGE = 10;

/**
 * Default limit for search results
 * Used in: useWorkspaceSearch hook
 */
export const DEFAULT_SEARCH_LIMIT = 5;

/**
 * Searchable hooks pagination defaults
 * Lower defaults for dropdown/search contexts where space is limited
 */

/**
 * Default items for searchable members dropdown
 * Used in: useSearchableMembers hook
 */
export const DEFAULT_SEARCHABLE_MEMBERS_PER_PAGE = 5;

/**
 * Default items for searchable projects dropdown
 * Used in: useSearchableProjects hook
 */
export const DEFAULT_SEARCHABLE_PROJECTS_PER_PAGE = 5;

/**
 * Default items for searchable links dropdown
 * Used in: useSearchableLinks hook
 */
export const DEFAULT_SEARCHABLE_LINKS_PER_PAGE = 5;

/**
 * Complete pagination defaults
 * Export all defaults for easy import
 */
export const PAGINATION_DEFAULTS = {
  WORKSPACES: DEFAULT_WORKSPACES_PER_PAGE,
  MEMBERS: DEFAULT_MEMBERS_PER_PAGE,
  DOMAINS: DEFAULT_DOMAINS_PER_PAGE,
  RECORDINGS: DEFAULT_RECORDINGS_PER_PAGE,
  PROJECTS: DEFAULT_PROJECTS_PER_PAGE,
  LINKS: DEFAULT_LINKS_PER_PAGE,
  SEARCH: DEFAULT_SEARCH_LIMIT,
  SEARCHABLE: {
    MEMBERS: DEFAULT_SEARCHABLE_MEMBERS_PER_PAGE,
    PROJECTS: DEFAULT_SEARCHABLE_PROJECTS_PER_PAGE,
    LINKS: DEFAULT_SEARCHABLE_LINKS_PER_PAGE,
  },
} as const;

/**
 * Default items per page for MCP connections
 * Used in: useMcpConnections hook
 */
export const DEFAULT_MCP_CONNECTIONS_PER_PAGE = 5;
