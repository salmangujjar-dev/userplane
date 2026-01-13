/**
 * Recording In Progress Screen
 * Shows live preview and recording indicator
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@workspace/ui/components/button';
import RecordingScreenLayout from './RecordingScreenLayout';
import {
  RECORDING_IN_PROGRESS_COPY,
  DEFAULT_COMPANY_NAME,
  DEFAULT_PRIMARY_COLOR,
} from '@/constants';
import type { RecordingPreferences } from '@/types/session-preferences';

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
  const [isLocalProcessing, setIsLocalProcessing] = useState(false);

  useEffect(() => {
    console.log('[RecordingInProgress] Setting up video preview');
    console.log('[RecordingInProgress] Media stream:', mediaStream ? 'Available' : 'Not available');

    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch((err) => {
        console.error('[RecordingInProgress] Failed to play video preview:', err);
      });
      console.log('[RecordingInProgress] Video preview started');
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [mediaStream]);

  // Reset local processing state when parent processing state changes
  // This handles cases where the parent fails to update isProcessing
  useEffect(() => {
    if (isProcessing) {
      // Parent confirmed processing started, keep local state in sync
      setIsLocalProcessing(true);
    } else {
      // Parent finished processing, reset local state
      setIsLocalProcessing(false);
    }
  }, [isProcessing]);

  const handleStopRecording = () => {
    // Prevent double-clicks with local state guard
    if (isLocalProcessing || isProcessing) {
      console.log('[RecordingInProgress] Stop already in progress, ignoring click');
      return;
    }

    console.log('[RecordingInProgress] Stop recording clicked');
    setIsLocalProcessing(true);

    if (onStopRecording) {
      onStopRecording();
    }
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
          <div className="w-full max-w-md mb-6 sm:mb-8 aspect-video border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-lg p-2">
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
        ) : (
          <div className="mb-6 sm:mb-8">
            <img
              src="/video.svg"
              alt="Recording"
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-800"
            />
          </div>
        )}

        <Button
          onClick={handleStopRecording}
          disabled={isProcessing || isLocalProcessing}
          className="w-full max-w-md h-11 sm:h-12 text-sm sm:text-base font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: primaryColor,
          }}
        >
          {isProcessing || isLocalProcessing
            ? 'Stopping recording'
            : RECORDING_IN_PROGRESS_COPY.stopButton}
        </Button>
      </div>
    </RecordingScreenLayout>
  );
}
