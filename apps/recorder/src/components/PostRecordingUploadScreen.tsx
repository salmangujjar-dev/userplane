/**
 * Post-Recording Upload Screen
 * Shows upload progress
 */

import RecordingScreenLayout from './RecordingScreenLayout';
import VideoPlayer from './VideoPlayer';
import { POST_RECORDING_UPLOAD_COPY } from '@/constants/screen-copy';
import type { RecordingPreferences } from '@/types/session-preferences';

interface PostRecordingUploadScreenProps {
  videoUrl: string;
  progress: number;
  preferences: RecordingPreferences;
}

export default function PostRecordingUploadScreen({
  videoUrl,
  progress,
  preferences,
}: PostRecordingUploadScreenProps) {
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
          {POST_RECORDING_UPLOAD_COPY.title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 text-center mb-6 sm:mb-8">
          {POST_RECORDING_UPLOAD_COPY.subtitle}
        </p>

        <div className="w-full max-w-md mb-6 sm:mb-8">
          <div className="aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden">
            <VideoPlayer src={videoUrl} showControls={false} muted={true} opacity={0.75} />
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
