import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/client';
import { DEFAULT_MEMBERS_PER_PAGE, DEFAULT_WORKSPACES_PER_PAGE } from '@/constants/pagination';
import {
  handleSafeResult,
  handleUnknownError,
  type SafeResult,
  showApiErrorToast,
} from '@/lib/errors';
import {
  showAccessRequestApprovedToast,
  showAccessRequestDeclinedToast,
  showInvitesAcceptedToast,
  showInvitesSentToast,
} from '@/lib/toasts';
import { useWorkspaceId, useWorkspaceStore } from '@/stores/workspace';
import type {
  InvitePolicyData,
  SuggestedWorkspace,
  WorkspaceMember,
  WorkspacePreferencesGetData,
  WorkspaceResourceCountsData,
  WorkspaceRole,
  WorkspaceStatusData,
  WorkspaceSuggestionsData,
} from '@/types';

import { useSlackSuggestions } from '../integrations/queries';
import { integrationKeys } from '../integrations/query-keys';
import { workspaceKeys } from './query-keys';

// Re-export types that are used by consumers
export type {
  InvitePolicyData,
  SuggestedWorkspace,
  WorkspaceMember,
  WorkspacePreferencesGetData,
  WorkspaceResourceCountsData,
  WorkspaceStatusData,
  WorkspaceSuggestionsData,
};

// Local types for this module
export type WorkspaceAccessStatus = 'member' | 'can_join' | 'can_request' | 'no_access';
export type JoinAction = 'join' | 'request';

type SearchType = 'members' | 'projects' | 'domains' | 'links';

export interface SearchMember {
  workspaceMemberId: string;
  role: string;
  userName: string;
  userEmail: string;
}

export interface SearchProject {
  projectId: string;
  projectTitle: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchLink {
  linkId: string;
  linkTitle: string | null;
}

type SearchResult = SearchMember | SearchProject | SearchLink;

/**
 * Hook to fetch workspace information
 * Returns workspace details including name and settings
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspace() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.getById({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to fetch all workspaces for the current user
 * Returns list of workspaces with optional membership information
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaces(options?: {
  page?: number;
  perPage?: number;
  includeWorkspaceMembership?: boolean;
  enabled?: boolean;
}) {
  const {
    page = 1,
    perPage = DEFAULT_WORKSPACES_PER_PAGE,
    includeWorkspaceMembership = true,
    enabled = true,
  } = options || {};

  return useQuery({
    queryKey: workspaceKeys.list({ page, perPage, includeWorkspaceMembership }),
    queryFn: async () => {
      const [error, response] = await apiClient.workspace.list({
        query: {
          page,
          per_page: perPage,
          include_workspace_membership: includeWorkspaceMembership,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to fetch workspace members
 * Returns all members in the workspace
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaceMembers(options?: {
  perPage?: number;
  page?: number;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const { perPage = DEFAULT_MEMBERS_PER_PAGE, page = 1, enabled = true } = options || {};

  return useQuery({
    queryKey: workspaceKeys.membersList(workspaceId ?? '', { page, perPage }),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.members.list({
        params: { workspaceId },
        query: {
          page: options?.page || 1,
          per_page: perPage,
        },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to fetch notification preferences for the current workspace
 * Returns notification settings for the current user in the workspace
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaceNotifications() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: workspaceKeys.notifications(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.notifications.get({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to fetch workspace preferences and recording link settings
 * Returns customization settings for recording links
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspacePreferences() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: workspaceKeys.preferences(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.preferences.get({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data.preferences ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to fetch the invite token for the current workspace
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaceInvite() {
  const workspaceId = useWorkspaceStore((state) => state.workspaceId);

  return useQuery({
    queryKey: workspaceKeys.invite(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.invite.getUrl({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

/**
 * Hook to fetch workspace invite policy
 * Returns the invite policy and allowed domains
 *
 * @param workspaceIdOverride - Optional workspace ID override (uses store if not provided)
 * @param options - Query options
 * Returns SafeResult - check result.success before using data
 */
export function useInvitePolicy(
  workspaceIdOverride?: string | null,
  options?: { enabled?: boolean }
) {
  const storeWorkspaceId = useWorkspaceId();
  const workspaceId = workspaceIdOverride ?? storeWorkspaceId;
  const { enabled = true } = options || {};

  return useQuery({
    queryKey: workspaceKeys.invitePolicy(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.invitePolicy.get({
        params: { workspaceId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to validate an invite token
 * This is a public endpoint and does not require authentication
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useValidateInvite(token: string | null, enabled = true) {
  return useQuery({
    queryKey: workspaceKeys.validateInvite(token ?? ''),
    queryFn: async () => {
      if (!token) {
        throw new Error('No invite token provided');
      }
      const [error, response] = await apiClient.invite.validate({
        body: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!token && enabled,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch workspace status and access info for current user
 * Used by WorkspaceAccessGate to determine what UI to show
 *
 * Returns:
 * - 'member' if user is already a member
 * - 'can_join' if workspace is whitelisted and domain matches
 * - 'can_request' if workspace is protected and domain matches
 * - 'no_access' if workspace is private or domain doesn't match
 *
 * Handles soft-deleted workspaces gracefully by returning isDeleted: true
 *
 * Returns SafeResult - check result.success before using data
 */
export function useWorkspaceStatus(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceKeys.status(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.status({
        params: { workspaceId },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    staleTime: 30 * 1000, // 30 seconds - shorter than workspace data
    retry: 1,
  });
}

export interface WorkspaceResourceCountsOptions {
  enabled?: boolean;
  includeProjects?: boolean;
  includeRecordings?: boolean;
  includeActiveRecordings?: boolean;
  includeLinks?: boolean;
  includeDomains?: boolean;
  includeMembers?: boolean;
}

/**
 * Hook to fetch resource counts for the current workspace
 * Returns aggregate counts of various workspace resources with flexible query params
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaceResourceCounts(
  options?: WorkspaceResourceCountsOptions
): ReturnType<typeof useQuery<SafeResult<WorkspaceResourceCountsData>>> {
  const workspaceId = useWorkspaceId();
  const {
    enabled = true,
    includeProjects = false,
    includeRecordings = false,
    includeActiveRecordings = false,
    includeLinks = false,
    includeDomains = false,
    includeMembers = false,
  } = options || {};

  return useQuery({
    queryKey: workspaceKeys.resourceCounts(workspaceId ?? '', {
      includeProjects,
      includeRecordings,
      includeActiveRecordings,
      includeLinks,
      includeDomains,
      includeMembers,
    }),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.getResourcesCount({
        params: { workspaceId },
        query: {
          include_projects: includeProjects,
          include_recordings: includeRecordings,
          include_active_recordings: includeActiveRecordings,
          include_links: includeLinks,
          include_domains: includeDomains,
          include_members: includeMembers,
        },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Hook to fetch suggested workspaces based on user's email domain
 * Returns paginated workspaces that match the user's email domain
 * Used when user has no workspaces to show discoverable options
 *
 * Returns SafeResult - check result.success before using data
 */
export function useWorkspaceSuggestions(options?: {
  page?: number;
  perPage?: number;
  enabled?: boolean;
}) {
  const { page = 1, perPage = 5, enabled = true } = options || {};

  return useQuery({
    queryKey: workspaceKeys.suggestions({ page, perPage }),
    queryFn: async () => {
      const [error, response] = await apiClient.workspace.suggest({
        query: { page, per_page: perPage },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Hook to search workspace entities using server-side search
 * Searches across members, projects, domains, and links
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaceSearch(options: {
  query: string;
  type: SearchType;
  limit?: number;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const { query, type, limit = 5, enabled = true } = options;

  return useQuery({
    queryKey: workspaceKeys.search(workspaceId ?? '', { type, query, limit }),
    queryFn: async (): Promise<SafeResult<SearchResult[]>> => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      if (!query || query.trim().length === 0) {
        return { success: true, data: [] };
      }

      const [error, response] = await apiClient.workspace.search({
        params: { workspaceId },
        query: {
          q: query.trim(),
          type,
          limit,
        },
      });

      return handleSafeResult(error, (response?.data.results as SearchResult[]) ?? null);
    },
    enabled: enabled && !!workspaceId && !!query && query.trim().length > 0,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}

/**
 * Hook to fetch workspace count for current user
 * Returns the count of workspaces the user is a member of
 *
 * Returns SafeResult - check result.success before using data
 */
export function useWorkspaceCount() {
  return useQuery({
    queryKey: workspaceKeys.count(),
    queryFn: async () => {
      const [error, response] = await apiClient.workspace.count({
        query: {},
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    retry: 1,
  });
}

/**
 * Hook to send email invitations to a workspace
 * @param workspaceId - The workspace ID to send invites for
 */
interface SendInvitesData {
  sentCount: number;
}

export function useSendWorkspaceInvites(workspaceId: string | null) {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<SendInvitesData>, Error, string[]>({
    mutationFn: async (emails: string[]) => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }
      const [error, response] = await apiClient.workspace.invite.send({
        params: { workspaceId },
        body: { emails },
      });
      return handleSafeResult(error, response?.data ? { sentCount: emails.length } : null);
    },
    onSuccess: (result, emails) => {
      if (!result.success) {
        // PLAN_LIMIT_EXCEEDED is handled by the caller via upsell sheet
        if (result.error.code !== 'PLAN_LIMIT_EXCEEDED') {
          showApiErrorToast(result.error);
        }
        return;
      }
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId ?? '') });
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.resourceCounts(workspaceId ?? ''),
      });
      showInvitesSentToast(emails.length);
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to send workspace invitations');
    },
  });
}

/**
 * Hook to accept a workspace invitation
 * This requires authentication
 */
type AcceptInviteData =
  | {
      alreadyMember: false;
      workspaceId: string;
      workspaceName: string;
    }
  | {
      alreadyMember: true;
      workspaceId: string;
      workspaceName: string;
    };

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation<SafeResult<AcceptInviteData>, Error, { workspaceId: string; token: string }>({
    mutationFn: async ({ workspaceId, token }) => {
      const [error, response] = await apiClient.workspace.invite.accept({
        params: { workspaceId },
        body: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (!result.success) {
        showApiErrorToast(result.error);
        return;
      }

      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(result.data.workspaceId) });

      if (result.data.alreadyMember) {
        // Don't show message for already member case
        return;
      }

      showInvitesAcceptedToast(result.data.workspaceName);
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to accept workspace invitation');
    },
  });
}

// ============================================
// WORKSPACE ROLE
// ============================================

export interface WorkspaceMembership {
  workspaceMemberId: string;
  workspaceRole: WorkspaceRole;
  workspaceJoinedAt: Date;
}

/**
 * Hook to fetch the current user's workspace role
 * Returns the current user's role in the workspace (owner, admin, or member)
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaceRole() {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: workspaceKeys.role(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.members.getMembership({
        params: { workspaceId },
      });

      const responseData = response?.data as
        | {
            workspaceId: string;
            workspaceMembership: WorkspaceMembership;
          }
        | undefined;

      const membership = responseData?.workspaceMembership;

      if (!membership) {
        throw new Error('Unable to retrieve workspace membership');
      }

      return handleSafeResult(error, membership);
    },
    enabled: !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Helper hook that returns whether the current user can edit workspace settings
 * Returns true if user is owner or admin, false otherwise
 */
export function useCanEditWorkspace() {
  const { data: roleResult, isLoading } = useWorkspaceRole();

  const canEdit =
    roleResult?.success &&
    (roleResult.data.workspaceRole === 'owner' || roleResult.data.workspaceRole === 'admin');

  return {
    canEdit: canEdit || false,
    isLoading,
    role: roleResult?.success ? roleResult.data.workspaceRole : null,
  };
}

// ============================================
// ACCESS REQUESTS
// ============================================

/**
 * Hook to validate an access request token and get request details
 * Returns SafeResult - check result.success before using data
 */
export function useValidateAccessRequest(token: string | null) {
  return useQuery({
    queryKey: workspaceKeys.accessRequestValidate(token ?? ''),
    queryFn: async () => {
      if (!token) {
        throw new Error('No token provided');
      }
      const [error, response] = await apiClient.workspace.accessRequest.validate({
        query: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to approve an access request
 * Returns SafeResult - check result.success in onSuccess callback
 */
export function useApproveAccessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const [error, response] = await apiClient.workspace.accessRequest.approve({
        body: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (result.success) {
        showAccessRequestApprovedToast();
        queryClient.invalidateQueries({ queryKey: workspaceKeys.accessRequests() });
      }
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to approve access request');
    },
  });
}

/**
 * Hook to decline an access request
 * Returns SafeResult - check result.success in onSuccess callback
 */
export function useDeclineAccessRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token: string) => {
      const [error, response] = await apiClient.workspace.accessRequest.decline({
        body: { token },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    onSuccess: (result) => {
      if (result.success) {
        showAccessRequestDeclinedToast();
        queryClient.invalidateQueries({ queryKey: workspaceKeys.accessRequests() });
      }
    },
    onError: (error: unknown) => {
      handleUnknownError(error, 'Failed to decline access request');
    },
  });
}

// ============================================
// RESTORE INFO
// ============================================

/**
 * Hook to fetch workspace restore information
 * Returns details about a deleted workspace that can be restored
 */
export function useWorkspaceRestoreInfo(workspaceId: string | null) {
  return useQuery({
    queryKey: workspaceKeys.restoreInfo(workspaceId ?? ''),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID provided');
      }
      const [error, response] = await apiClient.workspace.getRestoreInfo({
        params: { workspaceId },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: !!workspaceId,
    retry: false,
  });
}

// ============================================
// INTERCOM SUGGESTIONS
// ============================================

/**
 * Intercom suggestions response data
 */
export interface IntercomSuggestionsData {
  workspaceId: string;
  connected: boolean;
  suggestions: Array<{
    id: string;
    email: string;
    name: string | null;
  }>;
}

/**
 * Hook to fetch Intercom admin suggestions for invite modal
 * Returns suggested admins (non-members) when Intercom is connected
 * Gracefully degrades - returns empty suggestions on any error
 *
 * Returns SafeResult - check result.success before using data
 */
export function useIntercomSuggestions(limit: number = 5, enabled: boolean = true) {
  const workspaceId = useWorkspaceId();

  return useQuery({
    queryKey: integrationKeys.intercomSuggestions(workspaceId ?? '', limit),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID');
      }
      const [error, response] = await apiClient.workspace.integrations.intercom.suggestions({
        params: { workspaceId },
        query: { limit },
      });
      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 60 * 1000, // 1 minute
    retry: false, // Graceful degradation - don't retry
  });
}

/** Supported suggestion providers */
type SuggestionProvider = 'intercom' | 'slack';

/** Unified suggestion shape returned by useIntegrationSuggestions */
export interface WorkspaceSuggestion {
  id: string;
  email: string;
  name: string | null;
}

export interface IntegrationSuggestionsResult {
  /** Which provider the suggestions came from, or null if none connected */
  provider: SuggestionProvider | null;
  suggestions: WorkspaceSuggestion[];
  hasMore: boolean;
  /** Path to the full invite page for this provider */
  invitePath: string | null;
}

/** Maps each provider to its invite page path */
const PROVIDER_INVITE_PATHS: Record<SuggestionProvider, string> = {
  intercom: 'settings/integrations/intercom/invite',
  slack: 'settings/integrations/slack/invite',
};

/**
 * Provider-agnostic hook that returns member suggestions from whichever
 * integration is connected (Intercom, Slack, or none).
 *
 * Queries run in parallel. The first provider that reports `connected: true`
 * with suggestions wins. Falls back to empty if nothing is connected.
 */
export function useIntegrationSuggestions(limit: number = 5): IntegrationSuggestionsResult {
  const workspaceId = useWorkspaceId();
  const intercom = useIntercomSuggestions(limit);
  const slack = useSlackSuggestions(limit);

  // Intercom takes priority if connected with suggestions
  if (intercom.data?.success && intercom.data.data.connected) {
    return {
      provider: 'intercom',
      suggestions: intercom.data.data.suggestions,
      hasMore: intercom.data.data.hasMore,
      invitePath: workspaceId
        ? `/workspace/${workspaceId}/${PROVIDER_INVITE_PATHS.intercom}`
        : null,
    };
  }

  // Slack as fallback
  if (slack.data?.success && slack.data.data.connected) {
    return {
      provider: 'slack',
      suggestions: slack.data.data.suggestions,
      hasMore: slack.data.data.hasMore,
      invitePath: workspaceId ? `/workspace/${workspaceId}/${PROVIDER_INVITE_PATHS.slack}` : null,
    };
  }

  return { provider: null, suggestions: [], hasMore: false, invitePath: null };
}
