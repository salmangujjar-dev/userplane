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
  isDefault?: boolean;
}

/**
 * Project item details
 */
export interface ProjectItem {
  id: string;
  projectTitle: string | null;
  projectPath: string;
  isDefault: boolean;
  createdAt: Date;
}

/**
 * Result containing workspace projects
 */
export interface GetProjectsResult {
  workspaceId: string;
  projects: ProjectItem[];
}

/**
 * Request body for creating a project
 */
export interface CreateProjectRequest {
  projectTitle?: string | null;
}

/**
 * Result after creating a project
 */
export interface CreateProjectResult {
  workspaceId: string;
  project: ProjectItem;
  message: string;
}
