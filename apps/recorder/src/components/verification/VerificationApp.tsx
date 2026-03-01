'use client';

/**
 * Verification App
 * Main application component that orchestrates the domain verification flow
 * Handles postbridge communication with parent SDK
 */

import { useEffect, useState } from 'react';

import { URL_PARAMS } from '@/constants';
import {
  AppModeProvider,
  useAppMode,
  useCrossTabLock,
  useVerificationBridge,
} from '@/contexts/AppModeContext';
import { useVerificationFlow } from '@/hooks/useVerificationFlow';
import { createLogger } from '@/lib/logger';
import { createVerificationError } from '@/lib/verification-errors';
import { getUrlParams, parseWorkspaceIds } from '@/utils/url';

import VerificationErrorScreen from './VerificationErrorScreen';
import VerifiedScreen from './VerifiedScreen';
import VerifyingScreen from './VerifyingScreen';

const logger = createLogger('verification-app');

/**
 * Root component that provides app mode context
 */
export default function VerificationApp() {
  return (
    <AppModeProvider actionType="verification">
      <VerificationAppContent />
    </AppModeProvider>
  );
}

/**
 * Main content component that uses the app mode context
 */
function VerificationAppContent() {
  const { mode, isEmbedded } = useAppMode();
  const verificationBridge = useVerificationBridge();
  const crossTabLock = useCrossTabLock();

  // Initialize state from URL immediately
  const [token, setToken] = useState<string>(() => getUrlParams().token);
  const [workspaceIds, setWorkspaceIds] = useState<string[]>(() =>
    parseWorkspaceIds(getUrlParams().workspace)
  );

  // Initialize verification flow with verification bridge for parent communication
  // The bridge is used to request verification from parent so the origin is correct
  const { state, actions } = useVerificationFlow(token, workspaceIds, verificationBridge);

  // Effect to extract URL params
  useEffect(() => {
    logger.debug({ mode, isEmbedded }, 'app initialized');
    logger.debug({ lockStatus: crossTabLock.status }, 'cross-tab lock status');

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get(URL_PARAMS.TOKEN);
    const urlWorkspace = params.get(URL_PARAMS.WORKSPACE);

    if (urlToken) {
      setToken(urlToken);
    }
    if (urlWorkspace) {
      setWorkspaceIds(parseWorkspaceIds(urlWorkspace));
    }
  }, [mode, isEmbedded, crossTabLock.status]);

  // Report verification completion to parent via bridge (embedded mode only)
  useEffect(() => {
    if (!isEmbedded || !verificationBridge) return;

    if (state.state === 'verified' && state.result) {
      logger.debug('verification success reported to parent');
      // Verification bridge handles the flow
    }
  }, [verificationBridge, isEmbedded, state.state, state.result]);

  // In embedded mode, check cross-tab status before showing UI
  if (isEmbedded) {
    if (crossTabLock.isPending) {
      return <VerifyingScreen />;
    }

    if (crossTabLock.isBlocked) {
      return (
        <VerificationErrorScreen
          title="Process Already Active"
          subtitle={
            crossTabLock.error ||
            'Another process is currently active. Only one process can be active at a time across all tabs.'
          }
        />
      );
    }
  }

  switch (state.state) {
    case 'loading':
      return <VerifyingScreen />;

    case 'verifying':
      return <VerifyingScreen domainUrl={state.domainUrl ?? undefined} />;

    case 'verified':
      if (!state.result) {
        logger.error('no result in verified state');
        return <VerifyingScreen />;
      }
      return <VerifiedScreen domainUrl={state.result.domainUrl} />;

    case 'error': {
      const error = state.error ?? createVerificationError('VERIFICATION_UNKNOWN_ERROR');
      return (
        <VerificationErrorScreen
          title={error.title}
          subtitle={error.subtitle}
          primaryActionText="Try again"
          onPrimaryAction={actions.retry}
        />
      );
    }

    default:
      logger.warn({ state: state.state }, 'unknown state');
      return <VerifyingScreen />;
  }
}
