/**
 * Project-related types
 */

import type { PaginationMeta } from './common';

/**
 * Project object
 */
export interface Project {
  projectId: string;
  projectTitle: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Projects list response
 */
export interface ProjectsData {
  projects: Project[];
  pagination: PaginationMeta;
}
