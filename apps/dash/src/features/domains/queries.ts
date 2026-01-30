import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { z } from 'zod';

import { apiClient } from '@/client';
import { DEFAULT_DOMAINS_PER_PAGE } from '@/constants/pagination';
import { handleSafeResult } from '@/lib/errors';
import { DomainSortFieldSchema } from '@/schemas';
import { useWorkspaceId } from '@/stores/workspace';
import type { DomainStatus as DomainStatusEnum, SortDirection } from '@/types';

import { domainKeys } from './query-keys';

// Types inferred from contract schemas
export type DomainSortField = z.infer<typeof DomainSortFieldSchema>;

/**
 * Hook to fetch domains for the current workspace
 * Returns list of domains with their verification status
 *
 * Returns SafeResult - check result.success before using data
 * Known API errors won't trigger error monitoring
 */
export function useWorkspaceDomains(options?: {
  perPage?: number;
  page?: number;
  sortBy?: DomainSortField;
  sortDirection?: SortDirection;
  enabled?: boolean;
}) {
  const workspaceId = useWorkspaceId();
  const {
    perPage = DEFAULT_DOMAINS_PER_PAGE,
    page = 1,
    sortBy = 'created_at',
    sortDirection = 'desc',
    enabled = true,
  } = options || {};

  return useQuery({
    queryKey: domainKeys.list(workspaceId ?? '', {
      page,
      perPage,
      sort: { by: sortBy, direction: sortDirection },
    }),
    queryFn: async () => {
      if (!workspaceId) {
        throw new Error('No workspace ID available');
      }

      const [error, response] = await apiClient.workspace.domains.list({
        params: { workspaceId },
        query: { page, per_page: perPage, sort_by: sortBy, sort_direction: sortDirection },
      });

      return handleSafeResult(error, response?.data ?? null);
    },
    enabled: enabled && !!workspaceId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// ============================================
// DOMAIN STATUS POLLING
// ============================================

export interface DomainStatus {
  domainId: string;
  domainUrl: string;
  domainVerificationStatus: DomainStatusEnum;
  domainVerificationMethod: string | null;
  domainVerificationToken: string | null;
  domainSslStatus: string | null;
}

export interface DomainRecordingSettings {
  recordingHideSensitive: boolean;
  recordingCaptureClientLog: boolean;
  recordingCaptureClientAction: boolean;
  recordingCaptureServerLog: boolean;
  recordingCaptureNetworkLog: boolean;
}

export interface PollStatusResult {
  verified: boolean;
  settings: DomainRecordingSettings;
}

const POLL_INTERVAL = 5000; // 5 seconds
const MAX_POLL_ATTEMPTS = 60; // 5 minutes total

/**
 * Hook to poll domain verification status
 * Returns pollStatus function that accepts domainId and callbacks
 */
export function useDomainStatusPolling() {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    attemptRef.current = 0;
  }, []);

  const pollStatus = useCallback(
    (domainId: string, onSuccess?: (result: PollStatusResult) => void, onError?: () => void) => {
      if (!workspaceId || !domainId) return;

      attemptRef.current = 0;

      const poll = async () => {
        try {
          const [err, response] = await apiClient.workspace.domains.getById({
            params: { workspaceId, domainId },
          });

          if (err || !response?.data) {
            throw new Error('Failed to fetch domain status');
          }

          const domain = response.data as {
            domain: {
              domainStatus: 'pending' | 'verified' | 'revoked';
            };
          };

          if (domain.domain.domainStatus === 'verified') {
            stopPolling();
            // Invalidate domain list to update UI
            queryClient.invalidateQueries({ queryKey: domainKeys.lists() });

            // Fetch domain preferences for the result
            const [, prefResponse] = await apiClient.workspace.domains.preferences.get({
              params: { workspaceId, domainId },
            });

            const prefData = prefResponse?.data;
            const settings: DomainRecordingSettings = {
              recordingHideSensitive: prefData?.recordingHideSensitive ?? false,
              recordingCaptureClientLog: prefData?.recordingCaptureClientLog ?? true,
              recordingCaptureClientAction: prefData?.recordingCaptureClientAction ?? true,
              recordingCaptureServerLog: prefData?.recordingCaptureServerLog ?? true,
              recordingCaptureNetworkLog: prefData?.recordingCaptureNetworkLog ?? true,
            };

            onSuccess?.({ verified: true, settings });
            return;
          }

          attemptRef.current += 1;

          if (attemptRef.current >= MAX_POLL_ATTEMPTS) {
            stopPolling();
            onError?.();
            return;
          }

          // Continue polling
          timeoutRef.current = setTimeout(poll, POLL_INTERVAL);
        } catch {
          stopPolling();
          onError?.();
        }
      };

      poll();
    },
    [workspaceId, queryClient, stopPolling]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    pollStatus,
    stopPolling,
  };
}
