/**
 * Post-Recording Acknowledgment Screen
 * Shows success message after upload completes
 * Handles auto-close after delay in both embedded and standalone modes
 */

import Image from 'next/image';
import { type ReactNode, useEffect, useRef } from 'react';

import {
  DEFAULT_COMPANY_NAME,
  POST_RECORDING_ACK_COPY,
  SUCCESS_AUTO_CLOSE_DELAY_MS,
} from '@/constants';
import { useAppMode, useBridge } from '@/contexts/AppModeContext';
import { mediaClient } from '@/lib/media';
import type { RecordingPreferences } from '@/types/session-preferences';

import RecordingScreenLayout from './RecordingScreenLayout';

interface PostRecordingAckScreenProps {
  preferences: RecordingPreferences;
  /** Optional element for top-right corner (e.g., settings dropdown) */
  settingsElement?: ReactNode;
}

export default function PostRecordingAckScreen({
  preferences,
  settingsElement,
}: PostRecordingAckScreenProps) {
  const customizeLink = preferences.customizeLink;
  const { isEmbedded, isStandalone } = useAppMode();
  const bridge = useBridge();
  const cleanupDoneRef = useRef(false);

  // Auto-close after delay
  useEffect(() => {
    if (cleanupDoneRef.current) return;
    cleanupDoneRef.current = true;

    const timer = setTimeout(() => {
      if (isEmbedded && bridge) {
        // Embedded mode: finish session via bridge (host handles cleanup and close)
        bridge.finishSession();
      } else if (isStandalone) {
        // Standalone mode: close the tab directly
        window.close();
      }
    }, SUCCESS_AUTO_CLOSE_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isEmbedded, isStandalone, bridge]);

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink ? preferences.companyLogoUrl : null}
      workspaceName={customizeLink ? preferences.companyName : DEFAULT_COMPANY_NAME}
      footnoteText={customizeLink ? preferences.footnoteText : null}
      topRightElement={settingsElement}
    >
      <div className="flex flex-col items-center justify-center text-center w-full">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <Image
            src={mediaClient.getIconMediaUrl('icons/checkmark.svg')}
            alt="Success"
            width={32}
            height={32}
            className="w-8 h-8 sm:w-10 sm:h-10"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          {POST_RECORDING_ACK_COPY.title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-2">
          {POST_RECORDING_ACK_COPY.subtitle}
        </p>
        <p className="text-xs sm:text-sm text-gray-500">{POST_RECORDING_ACK_COPY.closeInfo}</p>
      </div>
    </RecordingScreenLayout>
  );
}
