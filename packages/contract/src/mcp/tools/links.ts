import { z } from 'zod';

import type { McpToolDefinition } from '../types';
import {
  DESTRUCTIVE_ANNOTATIONS,
  IDEMPOTENT_MUTATING_ANNOTATIONS,
  MUTATING_ANNOTATIONS,
  READ_ONLY_ANNOTATIONS,
} from '../types';

export const userplaneListLinks = {
  name: 'userplane_list_links',
  title: 'List recording links',
  description:
    'List recording links in a workspace. A link is a unique URL sent to end users to start a screen recording. Filter by project, domain, or creator.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    page: z.number().int().positive().optional().describe('Page number (default: 1)'),
    per_page: z
      .number()
      .int()
      .positive()
      .max(50)
      .optional()
      .describe('Results per page (default: 10, max: 50)'),
    project_id: z.string().optional().describe('Filter by project ID'),
    domain_id: z.string().optional().describe('Filter by domain ID'),
    created_by: z.string().optional().describe('Filter by creator workspace member ID'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneCreateLink = {
  name: 'userplane_create_link',
  title: 'Create a recording link',
  description:
    'Create a new recording link for a domain. The link generates a URL that initiates a screen recording when visited by an end user. Optionally assign to a project, add a reference name, or attach metadata.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    domainId: z.string().describe('Domain ID to associate the link with'),
    projectId: z.string().optional().describe('Project ID (uses default project if omitted)'),
    linkReference: z.string().optional().describe('Custom reference name for the link'),
    linkReusable: z.boolean().optional().describe('Whether the link is reusable (default: false)'),
    linkMeta: z.record(z.string(), z.string()).optional().describe('Custom key-value metadata'),
  },
  annotations: MUTATING_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneGetLink = {
  name: 'userplane_get_link',
  title: 'Get link details',
  description:
    'Retrieve full details for a recording link including URL, project, domain, provider integration, and metadata.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    linkId: z.string().describe('Link ID'),
  },
  annotations: READ_ONLY_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneUpdateLink = {
  name: 'userplane_update_link',
  title: 'Update a recording link',
  description:
    'Update settings on a recording link. Change the title, reusability, provider integration, or metadata. Only provided fields are updated.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    linkId: z.string().describe('Link ID'),
    linkTitle: z.string().optional().describe('New title for the link'),
    linkReusable: z.boolean().optional().describe('Whether the link is reusable'),
    linkProviderType: z
      .string()
      .optional()
      .describe('Provider type (e.g., "web", "zendesk", "intercom")'),
    linkProviderId: z.string().optional().describe('External provider ID'),
    linkProviderRef: z.string().optional().describe('External provider reference'),
    linkMeta: z.record(z.string(), z.string()).optional().describe('Custom key-value metadata'),
  },
  annotations: IDEMPOTENT_MUTATING_ANNOTATIONS,
} as const satisfies McpToolDefinition;

export const userplaneDeleteLink = {
  name: 'userplane_delete_link',
  title: 'Delete a recording link',
  description:
    'Delete a recording link. Only workspace admins, owners, or the link creator can delete. Existing recordings are not affected.',
  inputSchema: {
    workspaceId: z.string().describe('Workspace ID'),
    linkId: z.string().describe('Link ID'),
  },
  annotations: DESTRUCTIVE_ANNOTATIONS,
} as const satisfies McpToolDefinition;
