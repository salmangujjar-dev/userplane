/**
 * Recording In Progress Screen
 * Shows live preview and recording indicator
 */

import { Button } from '@workspace/ui/components/button';
import Image from 'next/image';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import {
  DEFAULT_COMPANY_NAME,
  DEFAULT_PRIMARY_COLOR,
  RECORDING_IN_PROGRESS_COPY,
} from '@/constants';
import { mediaClient } from '@/lib/media';
import type { RecordingPreferences } from '@/types/session-preferences';

import RecordingScreenLayout from './RecordingScreenLayout';

interface RecordingInProgressScreenProps {
  title?: string;
  subtitle?: string;
  mediaStream?: MediaStream | null;
  preferences: RecordingPreferences;
  isProcessing?: boolean;
  onStopRecording?: () => void;
  /** Optional element for top-right corner (e.g., settings dropdown) */
  settingsElement?: ReactNode;
}

export default function RecordingInProgressScreen({
  title = RECORDING_IN_PROGRESS_COPY.title,
  subtitle = RECORDING_IN_PROGRESS_COPY.subtitle,
  mediaStream,
  preferences,
  isProcessing = false,
  onStopRecording,
  settingsElement,
}: RecordingInProgressScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasClickedStop, setHasClickedStop] = useState(false);

  // Reset click tracking when parent processing completes (React recommended pattern)
  const prevIsProcessingRef = useRef(isProcessing);
  if (prevIsProcessingRef.current !== isProcessing) {
    prevIsProcessingRef.current = isProcessing;
    if (!isProcessing && hasClickedStop) {
      setHasClickedStop(false);
    }
  }

  // Derive effective processing state from parent prop + local click tracking
  const isLocalProcessing = isProcessing || hasClickedStop;

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(() => {});
    }

    const video = videoRef.current;
    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [mediaStream]);

  const handleStopRecording = () => {
    // Prevent double-clicks with local state guard
    if (isLocalProcessing) {
      return;
    }

    setHasClickedStop(true);
    onStopRecording?.();
  };

  const customizeLink = preferences.customizeLink;
  const primaryColor =
    customizeLink && preferences.primaryColor ? preferences.primaryColor : DEFAULT_PRIMARY_COLOR;

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink ? preferences.companyLogoUrl : null}
      workspaceName={customizeLink ? preferences.companyName : DEFAULT_COMPANY_NAME}
      footnoteText={customizeLink ? preferences.footnoteText : null}
      topRightElement={settingsElement}
    >
      <div className="flex flex-col items-center w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">{subtitle}</p>

        {mediaStream ? (
          <div className="w-full max-w-md mb-6 sm:mb-8">
            <div className="aspect-video border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-lg p-2">
              <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full shadow-md">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse-fast" />
                  <span className="text-xs font-semibold">REC</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 sm:mb-8">
            <Image
              src={mediaClient.getIconMediaUrl('icons/video.svg')}
              alt="Recording"
              width={64}
              height={64}
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-800"
            />
          </div>
        )}

        <div className="w-full max-w-md min-h-[140px] flex flex-col items-center justify-center">
          <Button
            onClick={handleStopRecording}
            disabled={isProcessing || isLocalProcessing}
            className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: primaryColor,
            }}
          >
            {isProcessing || isLocalProcessing
              ? 'Stopping recording'
              : RECORDING_IN_PROGRESS_COPY.stopButton}
          </Button>
        </div>
      </div>
    </RecordingScreenLayout>
  );
}
