/**
 * Verification App
 * Main application component that orchestrates the domain verification flow
 * Handles postbridge communication with parent SDK
 */

import { useEffect, useState } from 'react';
import { AppModeProvider, useAppMode, useBridge, useCrossTabLock } from '@/contexts/AppModeContext';
import { useVerificationFlow } from '@/hooks/useVerificationFlow';
import VerifyingScreen from './VerifyingScreen';
import VerifiedScreen from './VerifiedScreen';
import VerificationErrorScreen from './VerificationErrorScreen';
import { getUrlParams, parseWorkspaceIds } from '@/utils/url';
import { URL_PARAMS, VERIFICATION_ERROR_COPY } from '@/constants';

/**
 * Root component that provides app mode context
 */
export default function VerificationApp() {
  return (
    <AppModeProvider>
      <VerificationAppContent />
    </AppModeProvider>
  );
}

/**
 * Main content component that uses the app mode context
 */
function VerificationAppContent() {
  const { mode, isEmbedded } = useAppMode();
  const bridge = useBridge();
  const crossTabLock = useCrossTabLock();

  // Initialize state from URL immediately
  const [token, setToken] = useState<string>(() => getUrlParams().token);
  const [workspaceIds, setWorkspaceIds] = useState<string[]>(() =>
    parseWorkspaceIds(getUrlParams().workspace)
  );

  // Initialize verification flow
  const { state, actions } = useVerificationFlow(token, workspaceIds);

  // Effect to extract URL params
  useEffect(() => {
    console.log(
      '[VerificationApp] App mode:',
      mode,
      isEmbedded ? '(running in iframe)' : '(standalone)'
    );
    console.log('[VerificationApp] Cross-tab lock status:', crossTabLock.status);

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
    if (!isEmbedded || !bridge) return;

    if (state.state === 'verified' && state.result) {
      console.log('[VerificationApp] Reporting verification success to parent');
      // Bridge will handle session cleanup
    }
  }, [bridge, isEmbedded, state.state, state.result]);

  // In embedded mode, check cross-tab status before showing UI
  if (isEmbedded) {
    if (crossTabLock.isPending) {
      console.log('[VerificationApp] Waiting for cross-tab coordination...');
      return <VerifyingScreen />;
    }

    if (crossTabLock.isBlocked) {
      console.log('[VerificationApp] Blocked by another process:', crossTabLock.error);
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

  console.log('[VerificationApp] Current state:', state.state);

  switch (state.state) {
    case 'loading':
      console.log('[VerificationApp] Rendering: VerifyingScreen (loading)');
      return <VerifyingScreen />;

    case 'verifying':
      console.log('[VerificationApp] Rendering: VerifyingScreen');
      return <VerifyingScreen domainUrl={state.domainUrl ?? undefined} />;

    case 'verified':
      console.log('[VerificationApp] Rendering: VerifiedScreen');
      if (!state.result) {
        console.error('[VerificationApp] No result in verified state');
        return <VerifyingScreen />;
      }
      return <VerifiedScreen domainUrl={state.result.domainUrl} />;

    case 'error':
      console.log('[VerificationApp] Rendering: VerificationErrorScreen');
      const error = state.error ?? VERIFICATION_ERROR_COPY.unknownError;
      return (
        <VerificationErrorScreen
          title={error.title}
          subtitle={error.subtitle}
          primaryActionText="Try again"
          onPrimaryAction={actions.retry}
        />
      );

    default:
      console.log('[VerificationApp] Unknown state, rendering: VerifyingScreen');
      return <VerifyingScreen />;
  }
}
