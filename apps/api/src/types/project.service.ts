/**
 * Project service types
 * Types for project creation and management operations
 */

/**
 * Parameters for creating a project
 */
export interface CreateProjectParams {
  workspaceId: string;
  projectTitle: string | null;
}

/**
 * Parameters for creating a managed project
 */
export interface CreateManagedProjectParams {
  workspaceId: string;
  projectTitle: string;
  isDefault?: boolean;
}
