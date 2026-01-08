/**
 * Verification Flow Hook
 * Manages the domain verification flow state machine
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getRecorderClient } from '@/client/api';
import { VERIFICATION_ERROR_COPY } from '@/constants';

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
function mapErrorToVerificationError(error: unknown): VerificationError {
  // Check if it's an oRPC defined error with a code
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;

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
      default:
        return { ...VERIFICATION_ERROR_COPY.unknownError, code };
    }
  }

  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return VERIFICATION_ERROR_COPY.networkError;
  }

  // Default error
  return VERIFICATION_ERROR_COPY.unknownError;
}

/**
 * Hook for managing domain verification flow
 *
 * @param token - Verification token from URL
 * @param workspaceIds - Workspace IDs from URL (first one is used)
 * @returns Verification state and actions
 */
export function useVerificationFlow(
  token: string,
  workspaceIds: string[]
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
   * Perform the verification API call
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

    setState((prev) => ({
      ...prev,
      state: 'verifying',
      error: null,
    }));

    try {
      const client = getRecorderClient();

      console.log(
        '[useVerificationFlow] Calling domain.verify with token and workspaceIds:',
        workspaceIds
      );

      // Safe client returns [error, data] tuple
      const [error, response] = await client.domain.verify({
        body: { token, workspaceIds },
      });

      if (error) {
        console.error('[useVerificationFlow] Verification error:', error);
        setState({
          state: 'error',
          error: mapErrorToVerificationError(error),
          result: null,
          domainUrl: null,
        });
        return;
      }

      console.log('[useVerificationFlow] Verification success:', response);

      setState({
        state: 'verified',
        error: null,
        result: response.data,
        domainUrl: response.data.domainUrl,
      });
    } catch (err) {
      console.error('[useVerificationFlow] Unexpected error:', err);
      setState({
        state: 'error',
        error: mapErrorToVerificationError(err),
        result: null,
        domainUrl: null,
      });
    }
  }, [token, workspaceIds]);

  /**
   * Retry verification
   */
  const retry = useCallback(() => {
    verificationAttemptedRef.current = false;
    verify();
  }, [verify]);

  // Start verification on mount
  useEffect(() => {
    if (verificationAttemptedRef.current) return;
    verificationAttemptedRef.current = true;

    verify();
  }, [verify]);

  return {
    state,
    actions: { retry },
  };
}
