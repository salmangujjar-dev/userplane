/**
 * Recording In Progress Screen
 * Shows live preview and recording indicator
 */

import { useEffect, useRef } from 'react';
import { Button } from '@workspace/ui/components/button';
import RecordingScreenLayout from './RecordingScreenLayout';
import { RECORDING_IN_PROGRESS_COPY } from '@/constants/copy';
import type { RecordingPreferences } from '@/types/session-preferences';

interface RecordingInProgressScreenProps {
  title?: string;
  subtitle?: string;
  mediaStream?: MediaStream | null;
  preferences: RecordingPreferences;
  isProcessing?: boolean;
  onStopRecording?: () => void;
}

export default function RecordingInProgressScreen({
  title = RECORDING_IN_PROGRESS_COPY.title,
  subtitle = RECORDING_IN_PROGRESS_COPY.subtitle,
  mediaStream,
  preferences,
  isProcessing = false,
  onStopRecording,
}: RecordingInProgressScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const handleStopRecording = () => {
    if (onStopRecording) {
      onStopRecording();
    }
  };

  const customizeLink = preferences.customizeLink;
  const primaryColor =
    customizeLink && preferences.primaryColor ? preferences.primaryColor : '#000000';

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink ? preferences.companyLogoUrl : null}
      workspaceName={customizeLink ? preferences.companyName : 'Userplane'}
      footnoteText={customizeLink ? preferences.footnoteText : null}
    >
      <div className="flex flex-col items-center w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">{subtitle}</p>

        {mediaStream ? (
          <div className="w-full max-w-md mb-6 sm:mb-8">
            <div className="relative aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden bg-black shadow-lg">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full shadow-md">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
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
          disabled={isProcessing}
          className="w-full max-w-md h-11 sm:h-12 text-sm sm:text-base font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: primaryColor,
          }}
        >
          {isProcessing ? 'Stopping recording' : RECORDING_IN_PROGRESS_COPY.stopButton}
        </Button>
      </div>
    </RecordingScreenLayout>
  );
}
