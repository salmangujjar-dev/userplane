/**
 * Verification Flow Hook
 * Manages the domain verification flow state machine
 *
 * In embedded mode (iframe), verification requests are sent to the parent SDK via postbridge.
 * The parent makes the API call so the request origin is the parent's domain, which is
 * required for the API's origin validation.
 */

import * as Sentry from '@sentry/astro';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { VerificationBridgeConnection } from '@/bridge';
import { createLogger } from '@/lib/logger';
import { createVerificationError } from '@/lib/verification-errors';
import type { VerificationError } from '@/types/errors';

const logger = createLogger('verification-flow');

/**
 * Verification flow states
 */
export type VerificationFlowState = 'loading' | 'verifying' | 'verified' | 'error';

/**
 * Domain verification result data
 */
export interface VerificationResult {
  domainStatus: 'pending' | 'verified' | 'revoked';
  workspaceId: string;
  domainId: string;
  domainUrl: string;
}

/**
 * State for the verification flow
 */
export interface VerificationState {
  state: VerificationFlowState;
  error: VerificationError | null;
  result: VerificationResult | null;
  domainUrl: string | null;
}

/**
 * Actions available in the verification flow
 */
export interface VerificationFlowActions {
  retry: () => void;
}

/**
 * Hook for managing domain verification flow
 *
 * In embedded mode, verification is done via the bridge to the parent SDK.
 * The parent makes the actual API call so the origin header is correct.
 *
 * @param token - Verification token from URL
 * @param workspaceIds - Workspace IDs from URL
 * @param bridge - Verification bridge connection to parent SDK (required in embedded mode)
 * @returns Verification state and actions
 */
export function useVerificationFlow(
  token: string,
  workspaceIds: string[],
  bridge: VerificationBridgeConnection | null
): {
  state: VerificationState;
  actions: VerificationFlowActions;
} {
  const [flowState, setFlowState] = useState<VerificationFlowState>('loading');
  const [error, setError] = useState<VerificationError | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [domainUrl, setDomainUrl] = useState<string | null>(null);

  const verificationAttemptedRef = useRef(false);

  // Helper to track state transitions with Sentry breadcrumbs
  const transitionToState = useCallback(
    (newState: VerificationFlowState, context?: Record<string, unknown>) => {
      const previousState = flowState;

      Sentry.addBreadcrumb({
        category: 'verification_flow',
        message: `State transition: ${previousState} → ${newState}`,
        level: newState === 'error' ? 'warning' : 'info',
        data: {
          previous_state: previousState,
          new_state: newState,
          timestamp: Date.now(),
          ...context,
        },
      });

      setFlowState(newState);
    },
    [flowState]
  );

  /**
   * Perform the verification via bridge
   * The parent SDK makes the actual API call so the origin is correct
   */
  const verify = useCallback(async () => {
    if (!token) {
      setError(createVerificationError('VERIFICATION_TOKEN_MISSING'));
      setFlowState('error');
      return;
    }

    if (workspaceIds.length === 0) {
      setError(createVerificationError('VERIFICATION_WORKSPACE_MISSING'));
      setFlowState('error');
      return;
    }

    if (!bridge) {
      logger.error('no bridge connection available');

      // Capture bridge connection issues - critical for embedded verification
      const error = new Error('No bridge connection available for verification');
      Sentry.captureException(error, {
        level: 'error',
        tags: {
          error_type: 'verification_bridge_missing',
          error_source: 'verification_flow',
        },
      });

      setError(createVerificationError('VERIFICATION_BRIDGE_NOT_EMBEDDED'));
      setFlowState('error');
      return;
    }

    transitionToState('verifying', {
      workspace_ids: workspaceIds,
      has_bridge: !!bridge,
    });
    setError(null);

    logger.debug({ workspaceIds }, 'requesting verification via bridge');

    // Request verification from parent SDK
    // Parent makes the API call so the origin header is the parent's domain
    const verificationResult = await bridge.requestVerification(token, workspaceIds);

    if (!verificationResult.success) {
      logger.error({ err: verificationResult.error }, 'verification failed');
      setError(verificationResult.error ?? null);
      setFlowState('error');
      return;
    }

    logger.debug({ data: verificationResult.data }, 'verification succeeded');

    setResult(verificationResult.data as VerificationResult);
    setDomainUrl(verificationResult.data?.domainUrl ?? null);
    transitionToState('verified', {
      domain_url: verificationResult.data?.domainUrl,
      domain_status: verificationResult.data?.domainStatus,
      workspace_id: verificationResult.data?.workspaceId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, workspaceIds, bridge]);

  /**
   * Retry verification
   */
  const retry = useCallback(() => {
    verificationAttemptedRef.current = false;
    verify();
  }, [verify]);

  // Start verification when bridge is connected
  useEffect(() => {
    if (verificationAttemptedRef.current) return;
    // Wait for bridge to be available before attempting verification
    if (!bridge?.isConnected()) {
      logger.debug('waiting for bridge connection');
      return;
    }
    verificationAttemptedRef.current = true;

    verify();
  }, [verify, bridge]);

  return {
    state: {
      state: flowState,
      error,
      result,
      domainUrl,
    },
    actions: { retry },
  };
}
