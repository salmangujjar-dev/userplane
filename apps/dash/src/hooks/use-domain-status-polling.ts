'use client';

import { useRef, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import { useWorkspaceId } from '@/stores/workspace';
import {
  type DomainRecordingPreferences,
  DEFAULT_DOMAIN_RECORDING_PREFERENCES,
} from '@/lib/types/domain';

interface PollingResult {
  verified: boolean;
  settings: DomainRecordingPreferences;
}

interface UseDomainStatusPollingOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

interface UseDomainStatusPollingReturn {
  pollStatus: (
    domainId: string,
    onSuccess: (result: PollingResult) => void,
    onTimeout: () => void
  ) => void;
  stopPolling: () => void;
  isPolling: boolean;
}

/**
 * Hook for polling domain verification status with exponential backoff
 * Consolidates the polling logic that was repeated in domains-section.tsx
 */
export function useDomainStatusPolling(
  options: UseDomainStatusPollingOptions = {}
): UseDomainStatusPollingReturn {
  const { maxAttempts = 10, baseDelay = 1000, maxDelay = 10000 } = options;

  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearTimeout(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    isPollingRef.current = false;
  }, []);

  const fetchSettings = useCallback(
    async (domainId: string): Promise<DomainRecordingPreferences> => {
      if (!workspaceId) return DEFAULT_DOMAIN_RECORDING_PREFERENCES;

      try {
        const [error, response] = await apiClient.workspace.domains.preferences.get({
          params: { workspaceId, domainId },
        });

        if (error || !response) return DEFAULT_DOMAIN_RECORDING_PREFERENCES;
        return response.data;
      } catch {
        return DEFAULT_DOMAIN_RECORDING_PREFERENCES;
      }
    },
    [workspaceId]
  );

  const pollStatus = useCallback(
    (domainId: string, onSuccess: (result: PollingResult) => void, onTimeout: () => void) => {
      if (!workspaceId) return;

      isPollingRef.current = true;

      const poll = async (attempt: number) => {
        if (!isPollingRef.current) return;

        try {
          const [error, response] = await apiClient.workspace.domains.getById({
            params: { workspaceId, domainId },
          });

          if (error) throw error;

          const domain = response.data.domain;

          if (domain.domainStatus === 'verified') {
            stopPolling();
            queryClient.invalidateQueries({ queryKey: ['domains', workspaceId] });
            toast.success('Domain verified successfully');

            const settings = await fetchSettings(domainId);
            onSuccess({ verified: true, settings });
          } else if (attempt < maxAttempts) {
            // Continue polling with exponential backoff
            const delay = Math.min(baseDelay * Math.pow(1.5, attempt), maxDelay);
            pollingIntervalRef.current = setTimeout(() => {
              poll(attempt + 1);
            }, delay);
          } else {
            // Timeout after max attempts
            stopPolling();
            onTimeout();
          }
        } catch {
          stopPolling();
          onTimeout();
        }
      };

      poll(0);
    },
    [workspaceId, queryClient, fetchSettings, stopPolling, maxAttempts, baseDelay, maxDelay]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    pollStatus,
    stopPolling,
    isPolling: isPollingRef.current,
  };
}
