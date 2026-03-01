/**
 * Pre-Recording Screen
 * Lets user choose recording mode and start recording
 */

import { Button } from '@userplane/ui/components/button';
import Image from 'next/image';
import { type ReactNode, useState } from 'react';

import { DEFAULT_COMPANY_NAME, DEFAULT_PRIMARY_COLOR, PRE_RECORDING_COPY } from '@/constants';
import { mediaClient } from '@/lib/media';
import type { RecordingMode } from '@/services/media-capture';
import type { RecordingPreferences } from '@/types/session-preferences';

import RecordingScreenLayout from './RecordingScreenLayout';

interface PreRecordingScreenProps {
  /** Name of the person who requested the recording */
  requesterName?: string;
  /** Whether the start button is in loading state */
  isLoading?: boolean;
  /** Recording preferences for branding */
  preferences: RecordingPreferences;
  /** Callback when user clicks start recording */
  onStartRecording?: (mode: RecordingMode) => void;
  /** Optional element for top-right corner (e.g., settings dropdown) */
  settingsElement?: ReactNode;
}

export default function PreRecordingScreen({
  requesterName,
  isLoading = false,
  preferences,
  onStartRecording,
  settingsElement,
}: PreRecordingScreenProps) {
  const [selectedMode, setSelectedMode] = useState<'screen-voice' | 'screen-only'>('screen-only');

  const handleStartRecording = () => {
    if (onStartRecording && !isLoading) {
      onStartRecording(selectedMode);
    }
  };

  const customizeLink = preferences.customizeLink;
  const headerText =
    customizeLink && preferences.headerText ? preferences.headerText : PRE_RECORDING_COPY.title;
  const primaryColor =
    customizeLink && preferences.primaryColor ? preferences.primaryColor : DEFAULT_PRIMARY_COLOR;
  const selectedBorderColor = primaryColor;
  const selectedBgColor = `${primaryColor}0D`;

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink ? preferences.companyLogoUrl : null}
      workspaceName={customizeLink ? preferences.companyName : DEFAULT_COMPANY_NAME}
      footnoteText={customizeLink ? preferences.footnoteText : null}
      topRightElement={settingsElement}
    >
      <div className="flex flex-col items-center w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4">
          {headerText}
        </h1>
        {requesterName ? (
          <p className="text-sm sm:text-base text-gray-600 text-center mb-8 sm:mb-12">
            {PRE_RECORDING_COPY.subtitle(requesterName)}
          </p>
        ) : (
          <div className="mb-6 sm:mb-10" />
        )}

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-6 sm:mb-8 w-full max-w-md mx-auto">
          <button
            onClick={() => setSelectedMode('screen-voice')}
            className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 border-2 rounded-xl transition-all"
            style={{
              borderColor: selectedMode === 'screen-voice' ? selectedBorderColor : '#d1d5db',
              backgroundColor: selectedMode === 'screen-voice' ? selectedBgColor : 'transparent',
            }}
          >
            <Image
              src={mediaClient.getIconMediaUrl('icons/desktop.svg')}
              alt="Screen + Voice"
              width={48}
              height={48}
              className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4"
            />
            <span className="text-sm sm:text-base font-semibold text-gray-900">
              {PRE_RECORDING_COPY.screenVoiceLabel}
            </span>
          </button>

          <button
            onClick={() => setSelectedMode('screen-only')}
            className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 border-2 rounded-xl transition-all"
            style={{
              borderColor: selectedMode === 'screen-only' ? selectedBorderColor : '#d1d5db',
              backgroundColor: selectedMode === 'screen-only' ? selectedBgColor : 'transparent',
            }}
          >
            <Image
              src={mediaClient.getIconMediaUrl('icons/monitor.svg')}
              alt="Screen only"
              width={48}
              height={48}
              className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4"
            />
            <span className="text-sm sm:text-base font-semibold text-gray-900">
              {PRE_RECORDING_COPY.screenOnlyLabel}
            </span>
          </button>
        </div>

        <Button
          onClick={handleStartRecording}
          disabled={isLoading}
          className="w-full max-w-md h-11 sm:h-12 text-sm sm:text-base font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: primaryColor,
          }}
        >
          {isLoading ? 'Requesting permission...' : PRE_RECORDING_COPY.startButton}
        </Button>
      </div>
    </RecordingScreenLayout>
  );
}
