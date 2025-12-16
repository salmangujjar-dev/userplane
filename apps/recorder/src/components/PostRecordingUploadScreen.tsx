/**
 * Post-Recording Upload Screen
 * Shows upload progress
 */

import RecordingScreenLayout from './RecordingScreenLayout';
import { POST_RECORDING_UPLOAD_COPY } from '@/constants/screen-copy';
import type { UIPreferences } from '@/types/session-preferences';

interface PostRecordingUploadScreenProps {
  thumbnailUrl?: string;
  progress: number;
  workspaceLogoUrl?: string | null;
  workspaceName?: string | null;
  preferences: UIPreferences;
}

export default function PostRecordingUploadScreen({
  thumbnailUrl,
  progress,
  workspaceLogoUrl,
  workspaceName,
  preferences,
}: PostRecordingUploadScreenProps) {
  const customizeLink = preferences.customizeLink;
  const primaryColor =
    customizeLink && preferences.primaryColor ? preferences.primaryColor : '#000000';

  return (
    <RecordingScreenLayout
      workspaceLogoUrl={customizeLink ? workspaceLogoUrl : null}
      workspaceName={customizeLink ? workspaceName : 'Userplane'}
      footnoteText={customizeLink ? preferences.footnoteText : null}
    >
      <div className="flex flex-col items-center w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-3 sm:mb-4">
          {POST_RECORDING_UPLOAD_COPY.title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
          {POST_RECORDING_UPLOAD_COPY.subtitle}
        </p>

        <div className="w-full max-w-md mb-6 sm:mb-8">
          <div className="aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden bg-gray-100">
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt="Recording preview"
                className="w-full h-full object-cover opacity-75"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img
                  src="/video.svg"
                  alt="Recording"
                  className="w-12 h-12 sm:w-16 sm:h-16 opacity-50"
                />
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Uploading</span>
            <span className="text-xs sm:text-sm font-medium text-gray-900">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: primaryColor,
              }}
            />
          </div>
        </div>
      </div>
    </RecordingScreenLayout>
  );
}
