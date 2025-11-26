/**
 * Project service types
 * Types for project creation and management operations
 */

/**
 * Parameters for creating a project
 */
export interface CreateProjectParams {
  workspaceId: string;
  storeId: string;
  projectTitle: string | null;
}

/**
 * Parameters for creating a managed project with custom store
 */
export interface CreateManagedProjectParams {
  workspaceId: string;
  storeId: string;
  projectTitle: string;
  isDefault?: boolean;
}
