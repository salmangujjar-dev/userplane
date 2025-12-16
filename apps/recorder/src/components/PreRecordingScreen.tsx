/**
 * Pre-Recording Screen
 * Lets user choose recording mode and start recording
 */

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import RecordingScreenLayout from './RecordingScreenLayout';
import { PRE_RECORDING_COPY } from '@/constants/screen-copy';
import type { UIPreferences } from '@/types/session-preferences';

interface PreRecordingScreenProps {
  requesterName?: string;
  workspaceLogoUrl?: string | null;
  workspaceName?: string | null;
  maxRecordingDuration?: number;
  maxRecordingSize?: number | null;
  preferences: UIPreferences;
  onStartRecording?: (mode: 'screen-voice' | 'screen-only') => void;
}

export default function PreRecordingScreen({
  requesterName,
  workspaceLogoUrl,
  workspaceName,
  maxRecordingDuration,
  maxRecordingSize,
  preferences,
  onStartRecording,
}: PreRecordingScreenProps) {
  const [selectedMode, setSelectedMode] = useState<'screen-voice' | 'screen-only'>('screen-only');

  const handleStartRecording = () => {
    if (onStartRecording) {
      onStartRecording(selectedMode);
    }
  };

  const customizeLink = preferences.customizeLink;
  const headerText =
    customizeLink && preferences.headerText ? preferences.headerText : PRE_RECORDING_COPY.title;
  const primaryColor =
    customizeLink && preferences.primaryColor ? preferences.primaryColor : '#000000';
  const selectedBorderColor = primaryColor;
  const selectedBgColor = `${primaryColor}0D`;

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink ? workspaceLogoUrl : null}
      workspaceName={customizeLink ? workspaceName : 'Userplane'}
      footnoteText={customizeLink ? preferences.footnoteText : null}
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
          <div className="mb-8 sm:mb-12" />
        )}

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6 sm:mb-8 w-full max-w-md mx-auto">
          <button
            onClick={() => setSelectedMode('screen-voice')}
            className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 border-2 rounded-xl transition-all"
            style={{
              borderColor: selectedMode === 'screen-voice' ? selectedBorderColor : '#d1d5db',
              backgroundColor: selectedMode === 'screen-voice' ? selectedBgColor : 'transparent',
            }}
          >
            <img
              src="/desktop.svg"
              alt="Screen + Voice"
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
            <img
              src="/monitor.svg"
              alt="Screen only"
              className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4"
            />
            <span className="text-sm sm:text-base font-semibold text-gray-900">
              {PRE_RECORDING_COPY.screenOnlyLabel}
            </span>
          </button>
        </div>

        <Button
          onClick={handleStartRecording}
          className="w-full max-w-md h-11 sm:h-12 text-sm sm:text-base font-semibold text-white"
          style={{
            backgroundColor: primaryColor,
          }}
        >
          {PRE_RECORDING_COPY.startButton}
        </Button>
      </div>
    </RecordingScreenLayout>
  );
}
