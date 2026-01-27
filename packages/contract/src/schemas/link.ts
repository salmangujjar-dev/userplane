import { z } from 'zod';

import { LINK_PAGINATION } from '../constants';
import {
  DomainIdSchema,
  DomainStatusSchema,
  LinkIdSchema,
  LinkProviderTypeSchema,
  LinkTypeSchema,
  PaginationMetaSchema,
  ProjectIdSchema,
  ProviderIdSchema,
  ReferenceTextSchema,
  SortDirectionSchema,
  TitleSchema,
  WorkspaceIdSchema,
  WorkspaceMemberIdSchema,
} from './common';

/**
 * Link schemas
 */

/**
 * Link sort fields
 */
export const LinkSortFieldSchema = z.enum(['created_at', 'link_title']);

/**
 * List links query parameters (detailed mode)
 */
export const ListLinksQuerySchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    per_page: z.coerce
      .number()
      .int()
      .min(LINK_PAGINATION.MIN_PER_PAGE)
      .max(LINK_PAGINATION.MAX_PER_PAGE)
      .optional()
      .default(LINK_PAGINATION.DEFAULT_PER_PAGE),
    created_by: z.array(WorkspaceMemberIdSchema).optional(),
    project_id: z.array(ProjectIdSchema).optional(),
    domain_id: z.array(DomainIdSchema).optional(),
    link_provider_type: z.array(LinkProviderTypeSchema).optional(),
    link_type: LinkTypeSchema.optional(),
    sort_by: LinkSortFieldSchema.optional().default('created_at'),
    sort_direction: SortDirectionSchema.optional().default('desc'),
  }),
});

/**
 * Domain info in link
 */
export const LinkDomainSchema = z.object({
  domainId: DomainIdSchema,
  url: z.string(),
  status: DomainStatusSchema,
});

/**
 * Project info in link
 */
export const LinkProjectSchema = z.object({
  projectId: ProjectIdSchema,
  title: z.string().nullable(),
});

/**
 * Creator info in link
 */
// export const LinkCreatorSchema = z.object({
//   id: z.string(),
//   name: z.string(),
//   email: z.string().email(),
// });

/**
 * Link item in list
 */
export const LinkItemSchema = z.object({
  linkId: LinkIdSchema,
  linkTitle: z.string().nullable(),
  linkType: LinkTypeSchema,
  linkReusable: z.boolean(),
  linkProviderType: LinkProviderTypeSchema,
  linkProviderId: z.string().nullable(),
  linkProviderReference: z.string().nullable(),
  linkURL: z.string(),
  createdAt: z.date(),
  project: LinkProjectSchema,
  creator: z.object({
    workspaceMemberId: WorkspaceMemberIdSchema,
    name: z.string(),
  }),
  domain: LinkDomainSchema,
});

/**
 * Full link details
 * Note: Same as LinkItemSchema - creator already included without email in base schema
 */
export const LinkDetailsSchema = LinkItemSchema;

/**
 * Links list response
 */
export const LinksListDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  links: z.array(LinkItemSchema),
  pagination: PaginationMetaSchema,
});

/**
 * Create link request (detailed mode)
 */
export const CreateLinkSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
  }),
  body: z.object({
    projectId: ProjectIdSchema.optional(),
    domainId: DomainIdSchema,
    linkReference: ReferenceTextSchema.optional(),
    linkReusable: z.boolean().optional().default(false),
  }),
});

/**
 * Entitlement limit exceeded status
 */
export const EntitlementLimitExceededSchema = z.object({
  quotedLimit: z.boolean(),
  softLimit: z.boolean(),
  hardLimit: z.boolean(),
});

/**
 * Link create response
 */
export const LinkCreateDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  link: LinkItemSchema,
  recordingLimitExceeded: EntitlementLimitExceededSchema,
});

/**
 * Update link request (detailed mode)
 */
export const UpdateLinkSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    linkId: LinkIdSchema,
  }),
  body: z.object({
    linkTitle: TitleSchema.nullable().optional(),
    linkReusable: z.boolean().optional(),
    linkProviderType: LinkProviderTypeSchema.optional(),
    linkProviderId: ProviderIdSchema.nullable().optional(),
    linkProviderRef: ReferenceTextSchema.nullable().optional(),
  }),
});

/**
 * Link update response
 */
export const LinkUpdateDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  link: LinkItemSchema,
});

/**
 * Link get response
 */
export const LinkGetDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  link: LinkDetailsSchema,
});

/**
 * Link by ID request (detailed mode)
 */
export const LinkByIdSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    linkId: LinkIdSchema,
  }),
});

/**
 * Delete link request (detailed mode)
 */
export const DeleteLinkSchema = z.object({
  params: z.object({
    workspaceId: WorkspaceIdSchema,
    linkId: LinkIdSchema,
  }),
});

/**
 * Link delete response
 */
export const LinkDeleteDataSchema = z.object({
  workspaceId: WorkspaceIdSchema,
  linkId: LinkIdSchema,
});
