/**
 * Verification Flow Hook
 * Manages the domain verification flow state machine
 *
 * In embedded mode (iframe), verification requests are sent to the parent SDK via postbridge.
 * The parent makes the API call so the request origin is the parent's domain, which is
 * required for the API's origin validation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { VERIFICATION_ERROR_COPY } from '@/constants';
import type {
  RecorderBridgeConnection,
  VerificationResult as BridgeVerificationResult,
} from '@/bridge';

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
 * Error information for verification failures
 */
export interface VerificationError {
  title: string;
  subtitle: string;
  code?: string;
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
 * Map API error codes to user-friendly messages
 */
function mapErrorCodeToVerificationError(code: string): VerificationError {
  switch (code) {
    case 'DOMAIN_VERIFICATION_TOKEN_INVALID':
      return { ...VERIFICATION_ERROR_COPY.tokenInvalid, code };
    case 'DOMAIN_NOT_REGISTERED':
      return { ...VERIFICATION_ERROR_COPY.domainNotRegistered, code };
    case 'DOMAIN_WORKSPACE_MISMATCH':
      return { ...VERIFICATION_ERROR_COPY.workspaceMismatch, code };
    case 'DOMAIN_URL_INVALID':
      return { ...VERIFICATION_ERROR_COPY.urlInvalid, code };
    case 'DOMAIN_ORIGIN_INVALID':
      return { ...VERIFICATION_ERROR_COPY.originInvalid, code };
    case 'DOMAIN_ORIGIN_MISMATCH':
      return { ...VERIFICATION_ERROR_COPY.originMismatch, code };
    case 'DOMAIN_VERIFICATION_FAILED':
      return { ...VERIFICATION_ERROR_COPY.verificationFailed, code };
    case 'INTERNAL_SERVER_ERROR':
      return { ...VERIFICATION_ERROR_COPY.unknownError, code };
    case 'NOT_CONNECTED':
      return {
        title: 'Connection Error',
        subtitle: 'Unable to connect to the parent application. Please try refreshing the page.',
        code,
      };
    case 'BRIDGE_ERROR':
      return {
        title: 'Communication Error',
        subtitle: 'Failed to communicate with the parent application.',
        code,
      };
    case 'NETWORK_ERROR':
      return { ...VERIFICATION_ERROR_COPY.networkError, code };
    default:
      return { ...VERIFICATION_ERROR_COPY.unknownError, code };
  }
}

/**
 * Map bridge verification result error to user-friendly message
 */
function mapBridgeErrorToVerificationError(
  error: BridgeVerificationResult['error']
): VerificationError {
  if (!error) {
    return VERIFICATION_ERROR_COPY.unknownError;
  }
  return mapErrorCodeToVerificationError(error.code);
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
  const [state, setState] = useState<VerificationState>({
    state: 'loading',
    error: null,
    result: null,
    domainUrl: null,
  });

  const verificationAttemptedRef = useRef(false);

  /**
   * Perform the verification via bridge
   * The parent SDK makes the actual API call so the origin is correct
   */
  const verify = useCallback(async () => {
    if (!token) {
      setState({
        state: 'error',
        error: VERIFICATION_ERROR_COPY.tokenInvalid,
        result: null,
        domainUrl: null,
      });
      return;
    }

    if (workspaceIds.length === 0) {
      setState({
        state: 'error',
        error: {
          title: 'Missing workspace',
          subtitle: 'No workspace ID provided for verification.',
        },
        result: null,
        domainUrl: null,
      });
      return;
    }

    if (!bridge) {
      console.error('[useVerificationFlow] No bridge connection available');
      setState({
        state: 'error',
        error: {
          title: 'Connection Required',
          subtitle: 'Verification must be run from an embedded context with the SDK.',
          code: 'NOT_EMBEDDED',
        },
        result: null,
        domainUrl: null,
      });
      return;
    }

    setState((prev) => ({
      ...prev,
      state: 'verifying',
      error: null,
    }));

    console.log(
      '[useVerificationFlow] Requesting verification via bridge with token and workspaceIds:',
      workspaceIds
    );

    // Request verification from parent SDK
    // Parent makes the API call so the origin header is the parent's domain
    const result = await bridge.requestVerification(token, workspaceIds);

    if (!result.success) {
      console.error('[useVerificationFlow] Verification error:', result.error);
      setState({
        state: 'error',
        error: mapBridgeErrorToVerificationError(result.error),
        result: null,
        domainUrl: null,
      });
      return;
    }

    console.log('[useVerificationFlow] Verification success:', result.data);

    setState({
      state: 'verified',
      error: null,
      result: result.data as VerificationResult,
      domainUrl: result.data?.domainUrl ?? null,
    });
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
    state,
    actions: { retry },
  };
}
