/**
 * Pre-Recording Countdown Screen
 * Shows countdown timer before recording starts
 */

import { type ReactNode, useEffect, useRef } from 'react';

import { DEFAULT_COMPANY_NAME, DEFAULT_PRIMARY_COLOR } from '@/constants';
import type { RecordingPreferences } from '@/types/session-preferences';
import { lightenColor } from '@/utils';

import RecordingScreenLayout from './RecordingScreenLayout';

interface PreRecordingCountdownScreenProps {
  countdownSeconds: number;
  mediaStream?: MediaStream | null;
  preferences: RecordingPreferences;
  /** Optional element for top-right corner (e.g., settings dropdown) */
  settingsElement?: ReactNode;
}

export default function PreRecordingCountdownScreen({
  countdownSeconds,
  mediaStream,
  preferences,
  settingsElement,
}: PreRecordingCountdownScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    console.log('[Countdown] Setting up video preview');
    console.log('[Countdown] Media stream:', mediaStream ? 'Available' : 'Not available');

    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch((err) => {
        console.error('[Countdown] Failed to play video preview:', err);
      });
      console.log('[Countdown] Video preview started');
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [mediaStream]);

  const customizeLink = preferences.customizeLink;
  const primaryColor =
    customizeLink && preferences.primaryColor ? preferences.primaryColor : DEFAULT_PRIMARY_COLOR;
  const countdownColor = lightenColor(primaryColor, 30);

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink ? preferences.companyLogoUrl : null}
      workspaceName={customizeLink ? preferences.companyName : DEFAULT_COMPANY_NAME}
      footnoteText={customizeLink ? preferences.footnoteText : null}
      topRightElement={settingsElement}
    >
      <div className="flex flex-col items-center w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4">
          Get Ready
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
          Recording starts in...
        </p>

        {mediaStream ? (
          <div className="w-full max-w-md mb-6 sm:mb-8">
            <div className="relative aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden bg-white shadow-lg p-2">
              <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <div
                    className="text-9xl font-bold animate-pulse"
                    style={{ color: countdownColor }}
                  >
                    {countdownSeconds}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 sm:mb-8 flex flex-col items-center">
            <div
              className="text-9xl font-bold mb-4 animate-pulse"
              style={{ color: countdownColor }}
            >
              {countdownSeconds}
            </div>
            <img
              src="/video.svg"
              alt="Recording"
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 text-gray-800"
            />
          </div>
        )}

        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Preparing to record</span>
          </div>
        </div>
      </div>
    </RecordingScreenLayout>
  );
}
