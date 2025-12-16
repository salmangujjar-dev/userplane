/**
 * Pre-Recording Screen
 * Lets user choose recording mode and start recording
 */

import { useState } from 'react';
import { Button } from '@workspace/ui/components/button';
import RecordingScreenLayout from './RecordingScreenLayout';
import { PRE_RECORDING_COPY, DEFAULT_REQUESTER_NAME } from '@/constants/screen-copy';

interface PreRecordingScreenProps {
  requesterName?: string;
  workspaceLogoUrl?: string | null;
  workspaceName?: string | null;
  maxRecordingDuration?: number | null;
  maxRecordingSize?: number | null;
  onStartRecording?: (mode: 'screen-voice' | 'screen-only') => void;
}

export default function PreRecordingScreen({
  requesterName = DEFAULT_REQUESTER_NAME,
  workspaceLogoUrl,
  workspaceName,
  maxRecordingDuration,
  maxRecordingSize,
  onStartRecording,
}: PreRecordingScreenProps) {
  const [selectedMode, setSelectedMode] = useState<'screen-voice' | 'screen-only'>('screen-only');

  const handleStartRecording = () => {
    if (onStartRecording) {
      onStartRecording(selectedMode);
    }
  };

  return (
    <RecordingScreenLayout workspaceLogoUrl={workspaceLogoUrl} workspaceName={workspaceName}>
      <h1 className="text-3xl font-bold text-center mb-4">{PRE_RECORDING_COPY.title}</h1>
      <p className="text-gray-600 text-center mb-12">
        {PRE_RECORDING_COPY.subtitle(requesterName)}
      </p>

      <div className="flex gap-6 mb-8 w-full max-w-md">
        <button
          onClick={() => setSelectedMode('screen-voice')}
          className={`flex-1 flex flex-col items-center justify-center p-8 border-2 rounded-xl transition-all hover:border-gray-400 ${
            selectedMode === 'screen-voice' ? 'border-gray-900 bg-gray-50' : 'border-gray-300'
          }`}
        >
          <img src="/desktop.svg" alt="Screen + Voice" className="w-16 h-16 mb-4" />
          <span className="font-semibold text-gray-900">{PRE_RECORDING_COPY.screenVoiceLabel}</span>
        </button>

        <button
          onClick={() => setSelectedMode('screen-only')}
          className={`flex-1 flex flex-col items-center justify-center p-8 border-2 rounded-xl transition-all hover:border-gray-400 ${
            selectedMode === 'screen-only' ? 'border-gray-900 bg-gray-50' : 'border-gray-300'
          }`}
        >
          <img src="/monitor.svg" alt="Screen only" className="w-16 h-16 mb-4" />
          <span className="font-semibold text-gray-900">{PRE_RECORDING_COPY.screenOnlyLabel}</span>
        </button>
      </div>

      <Button
        onClick={handleStartRecording}
        className="w-full max-w-md h-12 text-base font-semibold"
      >
        {PRE_RECORDING_COPY.startButton}
      </Button>
    </RecordingScreenLayout>
  );
}
