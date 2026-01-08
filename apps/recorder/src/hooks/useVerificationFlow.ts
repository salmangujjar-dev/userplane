/**
 * Verification Flow Hook
 * Manages the domain verification flow state machine
 *
 * In embedded mode (iframe), verification requests are sent to the parent SDK via postbridge.
 * The parent makes the API call so the request origin is the parent's domain, which is
 * required for the API's origin validation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { VerificationError } from '@/types/errors';
import { createVerificationError } from '@/lib/verification-errors';
import type { RecorderBridgeConnection } from '@/bridge';

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
 * @param bridge - Bridge connection to parent SDK (required in embedded mode)
 * @returns Verification state and actions
 */
export function useVerificationFlow(
  token: string,
  workspaceIds: string[],
  bridge: RecorderBridgeConnection | null
): {
  state: VerificationState;
  actions: VerificationFlowActions;
} {
  const [flowState, setFlowState] = useState<VerificationFlowState>('loading');
  const [error, setError] = useState<VerificationError | null>(null);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [domainUrl, setDomainUrl] = useState<string | null>(null);

  const verificationAttemptedRef = useRef(false);

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
      console.error('[useVerificationFlow] No bridge connection available');
      setError(createVerificationError('VERIFICATION_BRIDGE_NOT_EMBEDDED'));
      setFlowState('error');
      return;
    }

    setFlowState('verifying');
    setError(null);

    console.log(
      '[useVerificationFlow] Requesting verification via bridge with token and workspaceIds:',
      workspaceIds
    );

    // Request verification from parent SDK
    // Parent makes the API call so the origin header is the parent's domain
    const verificationResult = await bridge.requestVerification(token, workspaceIds);

    if (!verificationResult.success) {
      console.error('[useVerificationFlow] Verification error:', verificationResult.error);
      setError(verificationResult.error ?? null);
      setFlowState('error');
      return;
    }

    console.log('[useVerificationFlow] Verification success:', verificationResult.data);

    setResult(verificationResult.data as VerificationResult);
    setDomainUrl(verificationResult.data?.domainUrl ?? null);
    setFlowState('verified');
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
      console.log('[useVerificationFlow] Waiting for bridge connection...');
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
