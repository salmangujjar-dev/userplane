/**
 * Public API contract implementation using oRPC
 * All endpoints use API key authentication (Bearer token).
 * Delegates to existing services — zero business logic duplication.
 */

import { linkError, recordingError } from '@userplane/contract';

import {
  type ApiKeyContext,
  type ApiKeyUserContext,
  createApiKeyAuthMiddleware,
  createApiKeyUserAuthMiddleware,
} from '@/api/middleware/api-key.orpc';
import { base } from '@/api/middleware/auth.orpc';
import type { LinkRepository } from '@/api/repositories/links.repository';
import type { RecordingRepository } from '@/api/repositories/recordings.repository';
import type { WorkspaceRepository } from '@/api/repositories/workspaces.repository';
import type { ApiKeyService } from '@/api/services/api-key.service';
import type { InviteService } from '@/api/services/invite.service';
import type { LinkService } from '@/api/services/link.service';
import type { ProjectService } from '@/api/services/project.service';
import type { RecordingService } from '@/api/services/recording.service';
import type { UserService } from '@/api/services/user.service';
import type { WorkspaceService } from '@/api/services/workspace.service';
import type { WorkspaceMemberService } from '@/api/services/workspace-member.service';
import { createPaginationMeta, type LinkSortOptions, type RecordingSortOptions } from '@/api/types';

type ApiKeyMiddleware = ReturnType<typeof createApiKeyAuthMiddleware>;
type ApiKeyUserMiddleware = ReturnType<typeof createApiKeyUserAuthMiddleware>;

// =============================================================================
// Public API Procedure Factory
// =============================================================================

export interface PublicApiDeps {
  apiKeyService: ApiKeyService;
  linkService: LinkService;
  recordingService: RecordingService;
  workspaceService: WorkspaceService;
  workspaceMemberService: WorkspaceMemberService;
  projectService: ProjectService;
  inviteService: InviteService;
  userService: UserService;
  workspaceRepo: WorkspaceRepository;
  recordingRepo: RecordingRepository;
  linkRepo: LinkRepository;
}

export const createPublicApiProcedures = (deps: PublicApiDeps) => {
  const apiKeyAuth = createApiKeyAuthMiddleware({
    apiKeyService: deps.apiKeyService,
    workspaceMemberService: deps.workspaceMemberService,
    workspaceService: deps.workspaceService,
  });
  const apiKeyUserAuth = createApiKeyUserAuthMiddleware({
    apiKeyService: deps.apiKeyService,
  });

  return {
    me: getMeImpl(deps, apiKeyUserAuth),
    workspaces: {
      list: listWorkspacesImpl(deps.workspaceService, apiKeyUserAuth),
    },
    links: {
      list: listLinksImpl(deps.linkService, apiKeyAuth),
      create: createLinkImpl(deps.linkService, apiKeyAuth),
      getById: getLinkByIdImpl(deps.linkService, apiKeyAuth),
      update: updateLinkImpl(deps.linkService, apiKeyAuth),
      delete: deleteLinkImpl(deps.linkService, apiKeyAuth),
    },
    recordings: {
      list: listRecordingsImpl(deps.recordingService, apiKeyAuth),
      getById: getRecordingByIdImpl(deps.recordingService, apiKeyAuth),
      delete: deleteRecordingImpl(deps.recordingService, apiKeyAuth),
      resources: {
        video: getRecordingVideoImpl(deps.recordingService, apiKeyAuth),
        thumbnail: getRecordingThumbnailImpl(deps.recordingService, apiKeyAuth),
        consoleLog: getRecordingConsoleLogImpl(deps.recordingService, apiKeyAuth),
        networkLog: getRecordingNetworkLogImpl(deps.recordingService, apiKeyAuth),
        action: getRecordingActionImpl(deps.recordingService, apiKeyAuth),
      },
    },
    workspace: {
      get: getWorkspaceImpl(deps.workspaceService, apiKeyAuth),
      inviteUrl: getInviteUrlImpl(deps.inviteService, apiKeyAuth),
    },
    projects: {
      list: listProjectsImpl(deps.projectService, apiKeyAuth),
      getById: getProjectByIdImpl(deps.projectService, apiKeyAuth),
    },
  };
};

// =============================================================================
// Links
// =============================================================================

const listLinksImpl = (linkService: LinkService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.links.list
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const filters = {
        createdBy: input.query.created_by,
        projectId: input.query.project_id,
        domainId: input.query.domain_id,
        linkProviderType: input.query.link_provider_type,
        linkType: input.query.link_type,
      };
      const sort: LinkSortOptions = {
        field: input.query.sort_by || 'created_at',
        direction: input.query.sort_direction || 'desc',
      };
      const { links, total } = await linkService.getByWorkspaceIdPaginated(
        input.params.workspaceId,
        input.query.page || 1,
        input.query.per_page || 10,
        filters,
        sort
      );
      return {
        message: 'Links retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          links,
          pagination: createPaginationMeta(
            input.query.page || 1,
            input.query.per_page || 10,
            total
          ),
        },
      };
    });

const createLinkImpl = (linkService: LinkService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.links.create
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const ctx = context as ApiKeyContext;
      const createdLink = await linkService.create({
        workspaceId: input.params.workspaceId,
        createdBy: ctx.workspaceMemberId,
        projectId: input.body.projectId,
        domainId: input.body.domainId,
        linkReference: input.body.linkReference,
        linkReusable: input.body.linkReusable,
        linkMeta: input.body.linkMeta,
      });
      const link = await linkService.getById(createdLink.linkId, input.params.workspaceId);
      return {
        message: 'Link created successfully',
        data: { workspaceId: input.params.workspaceId, link },
      };
    });

const getLinkByIdImpl = (linkService: LinkService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.links.getById
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const link = await linkService.getById(input.params.linkId, input.params.workspaceId);
      return {
        message: 'Link retrieved successfully',
        data: { workspaceId: input.params.workspaceId, link },
      };
    });

const updateLinkImpl = (linkService: LinkService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.links.update
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      await linkService.update(input.params.linkId, input.params.workspaceId, {
        linkTitle: input.body.linkTitle,
        linkReusable: input.body.linkReusable,
        linkProviderType: input.body.linkProviderType,
        linkProviderId: input.body.linkProviderId,
        linkProviderRef: input.body.linkProviderRef,
        linkMeta: input.body.linkMeta,
      });
      const link = await linkService.getById(input.params.linkId, input.params.workspaceId);
      return {
        message: 'Link updated successfully',
        data: { workspaceId: input.params.workspaceId, link },
      };
    });

const deleteLinkImpl = (linkService: LinkService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.links.delete
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const ctx = context as ApiKeyContext;
      const link = await linkService.getById(input.params.linkId, input.params.workspaceId);
      const isAdminOrOwner = ctx.workspaceRole === 'admin' || ctx.workspaceRole === 'owner';
      const isCreator = link.creator.workspaceMemberId === ctx.workspaceMemberId;
      if (!isAdminOrOwner && !isCreator) {
        throw linkError.LINK_DELETE_FORBIDDEN();
      }
      await linkService.delete(input.params.linkId, input.params.workspaceId);
      return {
        message: 'Link deleted successfully',
        data: { workspaceId: input.params.workspaceId, linkId: input.params.linkId },
      };
    });

// =============================================================================
// Recordings
// =============================================================================

const listRecordingsImpl = (recordingService: RecordingService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.recordings.list
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const filters = {
        createdBy: input.query.created_by,
        projectId: input.query.project_id,
        linkId: input.query.link_id,
      };
      const sort: RecordingSortOptions = {
        field: input.query.sort_by || 'created_at',
        direction: input.query.sort_direction || 'desc',
      };
      const { recordings, total } = await recordingService.getByWorkspaceIdPaginated(
        input.params.workspaceId,
        input.query.page || 1,
        input.query.per_page || 10,
        filters,
        sort
      );
      return {
        message: 'Recordings retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          recordings,
          pagination: createPaginationMeta(
            input.query.page || 1,
            input.query.per_page || 10,
            total
          ),
        },
      };
    });

const getRecordingByIdImpl = (recordingService: RecordingService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.recordings.getById
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const recording = await recordingService.getById(
        input.params.recordingId,
        input.params.workspaceId
      );
      return {
        message: 'Recording retrieved successfully',
        data: { workspaceId: input.params.workspaceId, recording },
      };
    });

const deleteRecordingImpl = (recordingService: RecordingService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.recordings.delete
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const ctx = context as ApiKeyContext;
      const recording = await recordingService.getById(
        input.params.recordingId,
        input.params.workspaceId
      );
      const isAdminOrOwner = ctx.workspaceRole === 'admin' || ctx.workspaceRole === 'owner';
      const isCreator = recording.meta.creator.workspaceMemberId === ctx.workspaceMemberId;
      if (!isAdminOrOwner && !isCreator) {
        throw recordingError.RECORDING_DELETE_FORBIDDEN();
      }
      await recordingService.delete(input.params.recordingId, input.params.workspaceId);
      return {
        message: 'Recording deleted successfully',
        data: { workspaceId: input.params.workspaceId, recordingId: input.params.recordingId },
      };
    });

const getRecordingVideoImpl = (recordingService: RecordingService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.recordings.resources.video
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const resource = await recordingService.getVideoResource(
        input.params.recordingId,
        input.params.workspaceId
      );
      return {
        message: 'Recording video URL retrieved successfully',
        data: { recordingId: input.params.recordingId, resource },
      };
    });

const getRecordingThumbnailImpl = (
  recordingService: RecordingService,
  apiKeyAuth: ApiKeyMiddleware
) =>
  base.publicApi.recordings.resources.thumbnail
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const resource = await recordingService.getThumbnailResource(
        input.params.recordingId,
        input.params.workspaceId
      );
      return {
        message: 'Recording thumbnail URL retrieved successfully',
        data: { recordingId: input.params.recordingId, resource },
      };
    });

const getRecordingConsoleLogImpl = (
  recordingService: RecordingService,
  apiKeyAuth: ApiKeyMiddleware
) =>
  base.publicApi.recordings.resources.consoleLog
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const resource = await recordingService.getConsoleLogResource(
        input.params.recordingId,
        input.params.workspaceId
      );
      return {
        message: 'Recording console log URL retrieved successfully',
        data: { recordingId: input.params.recordingId, resource },
      };
    });

const getRecordingNetworkLogImpl = (
  recordingService: RecordingService,
  apiKeyAuth: ApiKeyMiddleware
) =>
  base.publicApi.recordings.resources.networkLog
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const resource = await recordingService.getNetworkLogResource(
        input.params.recordingId,
        input.params.workspaceId
      );
      return {
        message: 'Recording network log URL retrieved successfully',
        data: { recordingId: input.params.recordingId, resource },
      };
    });

const getRecordingActionImpl = (recordingService: RecordingService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.recordings.resources.action
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const resource = await recordingService.getActionResource(
        input.params.recordingId,
        input.params.workspaceId
      );
      return {
        message: 'Recording action replay URL retrieved successfully',
        data: { recordingId: input.params.recordingId, resource },
      };
    });

// =============================================================================
// Me (user-scoped, no workspaceId)
// =============================================================================

const getMeImpl = (deps: PublicApiDeps, apiKeyUserAuth: ApiKeyUserMiddleware) =>
  base.publicApi.me.use(apiKeyUserAuth).handler(async ({ context }) => {
    const ctx = context as ApiKeyUserContext;

    const [userData, workspaceCount, recordingCount, linkCount] = await Promise.all([
      deps.userService.getById(ctx.userId),
      deps.workspaceRepo.countByUserId(ctx.userId),
      deps.recordingRepo.countByUserId(ctx.userId),
      deps.linkRepo.countByUserId(ctx.userId),
    ]);

    return {
      message: 'User profile retrieved successfully',
      data: {
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          emailVerified: userData.emailVerified,
          image: userData.image ?? null,
          createdAt: userData.createdAt,
        },
        stats: {
          workspaces: workspaceCount,
          recordings: recordingCount,
          links: linkCount,
        },
      },
    };
  });

// =============================================================================
// Workspaces (user-scoped, no workspaceId in path)
// =============================================================================

const listWorkspacesImpl = (
  workspaceService: WorkspaceService,
  apiKeyUserAuth: ApiKeyUserMiddleware
) =>
  base.publicApi.workspaces.list.use(apiKeyUserAuth).handler(async ({ input, context }) => {
    const ctx = context as ApiKeyUserContext;
    const page = input.query.page || 1;
    const perPage = input.query.per_page || 5;

    const { workspaces, total } = await workspaceService.getByUserIdPaginated(
      ctx.userId,
      page,
      perPage,
      { includeWorkspaceMembership: input.query.include_workspace_membership }
    );

    return {
      message: 'Workspaces retrieved successfully',
      data: {
        workspaces,
        total,
        pagination: createPaginationMeta(page, perPage, total),
      },
    };
  });

// =============================================================================
// Workspace (single, workspace-scoped)
// =============================================================================

const getWorkspaceImpl = (workspaceService: WorkspaceService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.workspace.get
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const workspace = await workspaceService.getById(input.params.workspaceId);
      return {
        message: 'Workspace retrieved successfully',
        data: { workspace },
      };
    });

const getInviteUrlImpl = (inviteService: InviteService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.workspace.inviteUrl
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input, context }) => {
      const ctx = context as ApiKeyContext;
      const inviteUrl = await inviteService.getInviteUrl(input.params.workspaceId, ctx.userId);
      return {
        message: 'Invite URL retrieved successfully',
        data: { inviteUrl, workspaceId: input.params.workspaceId },
      };
    });

// =============================================================================
// Projects
// =============================================================================

const listProjectsImpl = (projectService: ProjectService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.projects.list
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const { projects, total } = await projectService.getProjectsByWorkspacePaginated(
        input.params.workspaceId,
        input.query.page || 1,
        input.query.per_page || 5,
        input.query.sort_by || 'created_at',
        input.query.sort_direction || 'desc'
      );
      return {
        message: 'Projects retrieved successfully',
        data: {
          workspaceId: input.params.workspaceId,
          projects,
          pagination: createPaginationMeta(input.query.page || 1, input.query.per_page || 5, total),
        },
      };
    });

const getProjectByIdImpl = (projectService: ProjectService, apiKeyAuth: ApiKeyMiddleware) =>
  base.publicApi.projects.getById
    .use(apiKeyAuth, (input) => ({ workspaceId: input.params.workspaceId }))
    .handler(async ({ input }) => {
      const project = await projectService.getById(input.params.projectId);
      return {
        message: 'Project retrieved successfully',
        data: { workspaceId: input.params.workspaceId, project },
      };
    });
