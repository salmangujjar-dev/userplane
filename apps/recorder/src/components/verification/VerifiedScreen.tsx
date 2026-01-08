/**
 * Verified Screen
 * Shows success message after domain verification completes
 * Handles auto-close after delay
 */

import { useEffect, useRef } from 'react';
import VerificationScreenLayout from './VerificationScreenLayout';
import { DEFAULT_COMPANY_NAME, SUCCESS_AUTO_CLOSE_DELAY_MS } from '@/constants';
import { useAppMode, useBridge } from '@/contexts/AppModeContext';

interface VerifiedScreenProps {
  domainUrl: string;
  workspaceLogoUrl?: string | null;
  workspaceName?: string | null;
}

export default function VerifiedScreen({
  domainUrl,
  workspaceLogoUrl,
  workspaceName,
}: VerifiedScreenProps) {
  const { isEmbedded, isStandalone } = useAppMode();
  const bridge = useBridge();
  const cleanupDoneRef = useRef(false);

  // Auto-close after delay
  useEffect(() => {
    if (cleanupDoneRef.current) return;
    cleanupDoneRef.current = true;

    console.log(`[VerifiedScreen] Will auto-close in ${SUCCESS_AUTO_CLOSE_DELAY_MS}ms`);

    const timer = setTimeout(() => {
      if (isEmbedded && bridge) {
        // Embedded mode: finish session via bridge (host handles cleanup and close)
        console.log('[VerifiedScreen] Finishing session (embedded)');
        bridge.finishSession();
      } else if (isStandalone) {
        // Standalone mode: close the tab directly
        console.log('[VerifiedScreen] Closing tab (standalone)');
        window.close();
      }
    }, SUCCESS_AUTO_CLOSE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isEmbedded, isStandalone, bridge]);

  return (
    <VerificationScreenLayout
      workspaceLogoUrl={workspaceLogoUrl}
      workspaceName={workspaceName ?? DEFAULT_COMPANY_NAME}
    >
      <div className="flex flex-col items-center justify-center text-center w-full">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <img src="/checkmark.svg" alt="Success" className="w-8 h-8 sm:w-10 sm:h-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          Domain verified
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-2">
          <span className="font-medium">{domainUrl}</span> has been successfully verified.
        </p>
        <p className="text-xs sm:text-sm text-gray-500">This window will close automatically</p>
      </div>
    </VerificationScreenLayout>
  );
}
