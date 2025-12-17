/**
 * Post-Recording Review Screen
 * Lets user review recording before submitting
 */

import { Button } from '@workspace/ui/components/button';
import RecordingScreenLayout from './RecordingScreenLayout';
import VideoPlayer from './VideoPlayer';
import { POST_RECORDING_REVIEW_COPY } from '@/constants/screen-copy';
import type { RecordingPreferences } from '@/types/session-preferences';

interface PostRecordingReviewScreenProps {
  title?: string;
  subtitle?: string;
  videoUrl: string;
  preferences: RecordingPreferences;
  onSubmit?: () => void;
  onStartOver?: () => void;
}

export default function PostRecordingReviewScreen({
  title = POST_RECORDING_REVIEW_COPY.title,
  subtitle = POST_RECORDING_REVIEW_COPY.subtitle,
  videoUrl,
  preferences,
  onSubmit,
  onStartOver,
}: PostRecordingReviewScreenProps) {
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit();
    }
  };

  const handleStartOver = () => {
    if (onStartOver) {
      onStartOver();
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

        <div className="w-full max-w-md mb-6 sm:mb-8">
          <div className="aspect-video w-full border-2 border-gray-300 rounded-xl overflow-hidden">
            <VideoPlayer src={videoUrl} showControls={true} />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full max-w-md h-11 sm:h-12 text-sm sm:text-base font-semibold mb-3 text-white"
          style={{
            backgroundColor: primaryColor,
          }}
        >
          {POST_RECORDING_REVIEW_COPY.submitButton}
        </Button>

        <button
          onClick={handleStartOver}
          className="text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors"
        >
          {POST_RECORDING_REVIEW_COPY.startOverLink}
        </button>
      </div>
    </RecordingScreenLayout>
  );
}
