/**
 * Post-Recording Acknowledgment Screen
 * Shows success message after upload completes
 */

import RecordingScreenLayout from './RecordingScreenLayout';
import { POST_RECORDING_ACK_COPY } from '@/constants/screen-copy';
import type { RecordingPreferences } from '@/types/session-preferences';

interface PostRecordingAckScreenProps {
  preferences: RecordingPreferences;
}

export default function PostRecordingAckScreen({ preferences }: PostRecordingAckScreenProps) {
  const customizeLink = preferences.customizeLink;

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink ? preferences.companyLogoUrl : null}
      workspaceName={customizeLink ? preferences.companyName : 'Userplane'}
      footnoteText={customizeLink ? preferences.footnoteText : null}
    >
      <div className="flex flex-col items-center justify-center text-center w-full">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
          <img src="/checkmark.svg" alt="Success" className="w-8 h-8 sm:w-10 sm:h-10" />
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
