import { z } from 'zod';
import {
  LinkProviderTypeSchema,
  LinkTypeSchema,
  DomainStatusSchema,
  SortDirectionSchema,
  PaginationMetaSchema,
} from './common';
import { LINK_PAGINATION } from '../constants';

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
    workspaceId: z.string(),
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
    created_by: z.array(z.string()).optional(),
    project_id: z.array(z.string()).optional(),
    domain_id: z.array(z.string()).optional(),
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
  domainId: z.string(),
  url: z.string(),
  status: DomainStatusSchema,
});

/**
 * Project info in link
 */
export const LinkProjectSchema = z.object({
  projectId: z.string(),
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
  linkId: z.string(),
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
    workspaceMemberId: z.string(),
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
  workspaceId: z.string(),
  links: z.array(LinkItemSchema),
  pagination: PaginationMetaSchema,
});

/**
 * Create link request (detailed mode)
 */
export const CreateLinkSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
  }),
  body: z.object({
    projectId: z.string().optional(),
    domainId: z.string().min(1),
    linkReference: z.string().max(2048).optional(),
    linkReusable: z.boolean().optional().default(false),
  }),
});

/**
 * Link create response
 */
export const LinkCreateDataSchema = z.object({
  workspaceId: z.string(),
  link: LinkItemSchema,
});

/**
 * Update link request (detailed mode)
 */
export const UpdateLinkSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    linkId: z.string(),
  }),
  body: z.object({
    linkTitle: z.string().max(255).nullable().optional(),
    linkReusable: z.boolean().optional(),
    linkProviderType: LinkProviderTypeSchema.optional(),
    linkProviderId: z.string().max(255).nullable().optional(),
    linkProviderRef: z.string().max(2048).nullable().optional(),
  }),
});

/**
 * Link update response
 */
export const LinkUpdateDataSchema = z.object({
  workspaceId: z.string(),
  link: LinkItemSchema,
});

/**
 * Link get response
 */
export const LinkGetDataSchema = z.object({
  workspaceId: z.string(),
  link: LinkDetailsSchema,
});

/**
 * Link by ID request (detailed mode)
 */
export const LinkByIdSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    linkId: z.string(),
  }),
});

/**
 * Delete link request (detailed mode)
 */
export const DeleteLinkSchema = z.object({
  params: z.object({
    workspaceId: z.string(),
    linkId: z.string(),
  }),
});

/**
 * Link delete response
 */
export const LinkDeleteDataSchema = z.object({
  workspaceId: z.string(),
  linkId: z.string(),
});
