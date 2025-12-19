import { z } from 'zod';
import { PaginationMetaSchema } from './common';

/**
 * Project schemas
 */

/**
 * Project item
 */
export const ProjectItemSchema = z.object({
  projectId: z.string(),
  projectTitle: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.string(),
});

/**
 * Create project request (detailed mode)
 */
export const CreateProjectSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    projectTitle: z.string().nullable().optional(),
  }),
});

/**
 * Project create response
 */
export const ProjectDataSchema = z.object({
  workspaceId: z.string(),
  project: ProjectItemSchema,
});

/**
 * Projects list query parameters (detailed mode)
 */
export const ListProjectsQuerySchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  query: z.object({
    page: z.number().int().positive().optional().default(1),
  }),
});

/**
 * Projects list response
 */
export const ProjectsListDataSchema = z.object({
  workspaceId: z.string(),
  projects: z.array(ProjectItemSchema),
  pagination: PaginationMetaSchema,
});

/**
 * Update project request (detailed mode)
 */
export const UpdateProjectSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    projectId: z.string(),
  }),
  body: z.object({
    projectTitle: z.string().nullable().optional(),
    isDefault: z.boolean().optional(),
  }),
});

/**
 * Project update response
 */
export const ProjectUpdateDataSchema = z.object({
  projectId: z.string(),
});

/**
 * Replace project request (detailed mode)
 */
export const ReplaceProjectSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    projectId: z.string(),
  }),
  body: z.object({
    projectTitle: z.string().nullable(),
    isDefault: z.boolean(),
  }),
});

/**
 * Delete project request (detailed mode)
 */
export const DeleteProjectSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    projectId: z.string(),
  }),
});

/**
 * Project delete response
 */
export const ProjectDeleteDataSchema = z.object({
  projectId: z.string(),
});
