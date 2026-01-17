'use client';

import { useReducer, useCallback } from 'react';
import { apiClient } from '@/client';
import { toast } from '@workspace/ui/components/sonner';
import { useWorkspaceId } from '@/stores/workspace';
import { useDomainStatusPolling } from './use-domain-status-polling';
import {
  type DomainRecordingPreferences,
  type DomainIdentifier,
  DEFAULT_DOMAIN_RECORDING_PREFERENCES,
} from '@/types/domain';

// Verification step types
export type VerificationStep = 'pre' | 'verifying' | 'post' | null;

// State interface
interface VerificationState {
  domain: DomainIdentifier | null;
  step: VerificationStep;
  success: boolean;
  settings: DomainRecordingPreferences;
}

// Action types
type VerificationAction =
  | { type: 'START_VERIFICATION'; payload: DomainIdentifier }
  | { type: 'SET_STEP'; payload: VerificationStep }
  | { type: 'VERIFICATION_SUCCESS'; payload: DomainRecordingPreferences }
  | { type: 'VERIFICATION_FAILED' }
  | { type: 'UPDATE_SETTINGS'; payload: DomainRecordingPreferences }
  | { type: 'RESET' };

// Initial state
const initialState: VerificationState = {
  domain: null,
  step: null,
  success: true,
  settings: { ...DEFAULT_DOMAIN_RECORDING_PREFERENCES },
};

// Reducer function
function verificationReducer(
  state: VerificationState,
  action: VerificationAction
): VerificationState {
  switch (action.type) {
    case 'START_VERIFICATION':
      return {
        ...state,
        domain: action.payload,
        step: 'pre',
        success: true,
      };
    case 'SET_STEP':
      return {
        ...state,
        step: action.payload,
      };
    case 'VERIFICATION_SUCCESS':
      return {
        ...state,
        step: 'post',
        success: true,
        settings: action.payload,
      };
    case 'VERIFICATION_FAILED':
      return {
        ...state,
        step: 'post',
        success: false,
      };
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: action.payload,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

interface UseVerificationFlowReturn {
  state: VerificationState;
  startVerification: (domain: DomainIdentifier) => void;
  beginVerifying: () => Promise<void>;
  reverify: () => void;
  updateSettings: (settings: DomainRecordingPreferences) => void;
  closeModals: () => void;
}

/**
 * Hook to manage the domain verification flow state
 * Uses a reducer pattern to manage the complex state transitions
 */
export function useVerificationFlow(): UseVerificationFlowReturn {
  const workspaceId = useWorkspaceId();
  const [state, dispatch] = useReducer(verificationReducer, initialState);
  const { pollStatus, stopPolling } = useDomainStatusPolling();

  const startVerification = useCallback((domain: DomainIdentifier) => {
    dispatch({ type: 'START_VERIFICATION', payload: domain });
  }, []);

  const beginVerifying = useCallback(async () => {
    if (!workspaceId || !state.domain) return;

    try {
      dispatch({ type: 'SET_STEP', payload: 'verifying' });

      // Get verification URL from backend
      const [error, response] = await apiClient.workspace.domains.getVerificationUrl({
        params: { workspaceId, domainId: state.domain.id },
      });

      if (error) {
        console.error('Verification error:', error);
        throw error;
      }

      const verificationUrl = response.data.verificationUrl;

      // Open verification URL in new tab
      window.open(verificationUrl, '_blank', 'noopener,noreferrer');

      // Start polling for verification status
      pollStatus(
        state.domain.id,
        (result) => {
          dispatch({ type: 'VERIFICATION_SUCCESS', payload: result.settings });
        },
        () => {
          dispatch({ type: 'VERIFICATION_FAILED' });
        }
      );
    } catch {
      dispatch({ type: 'RESET' });
      toast.error('Failed to start verification');
    }
  }, [workspaceId, state.domain, pollStatus]);

  const reverify = useCallback(() => {
    stopPolling();
    dispatch({ type: 'SET_STEP', payload: 'pre' });
  }, [stopPolling]);

  const updateSettings = useCallback((settings: DomainRecordingPreferences) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const closeModals = useCallback(() => {
    stopPolling();
    dispatch({ type: 'RESET' });
  }, [stopPolling]);

  return {
    state,
    startVerification,
    beginVerifying,
    reverify,
    updateSettings,
    closeModals,
  };
}

/**
 * Hook to fetch domain settings
 */
export function useFetchDomainSettings() {
  const workspaceId = useWorkspaceId();

  const fetchSettings = useCallback(
    async (domainId: string): Promise<DomainRecordingPreferences> => {
      if (!workspaceId) return DEFAULT_DOMAIN_RECORDING_PREFERENCES;

      try {
        const [error, response] = await apiClient.workspace.domains.preferences.get({
          params: { workspaceId, domainId },
        });

        if (error) return DEFAULT_DOMAIN_RECORDING_PREFERENCES;
        return response.data;
      } catch {
        return DEFAULT_DOMAIN_RECORDING_PREFERENCES;
      }
    },
    [workspaceId]
  );

  return { fetchSettings };
}

/**
 * Hook to get verification URL
 */
export function useStartDomainVerification() {
  const workspaceId = useWorkspaceId();

  const getVerificationUrl = useCallback(
    async (domainId: string): Promise<string | null> => {
      if (!workspaceId) return null;

      try {
        const [error, response] = await apiClient.workspace.domains.getVerificationUrl({
          params: { workspaceId, domainId },
        });

        if (error) return null;
        return response.data.verificationUrl;
      } catch {
        return null;
      }
    },
    [workspaceId]
  );

  return { getVerificationUrl };
}

/**
 * Hook to poll verification status (single check)
 */
export function usePollDomainVerification() {
  const workspaceId = useWorkspaceId();

  const checkVerification = useCallback(
    async (domainId: string): Promise<boolean> => {
      if (!workspaceId) return false;

      try {
        const [error, response] = await apiClient.workspace.domains.getById({
          params: { workspaceId, domainId },
        });

        if (error) return false;
        return response.data.domain.domainStatus === 'verified';
      } catch {
        return false;
      }
    },
    [workspaceId]
  );

  return { checkVerification };
}
